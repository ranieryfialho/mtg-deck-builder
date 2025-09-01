import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManaCurveChart } from "@/components/deck/ManaCurveChart";

// --- FUNÇÕES DE API ---
const fetchDeckDetails = async (deckId, userId) => {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .eq("user_id", userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

const fetchDeckCards = async (deckId) => {
  const { data, error } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", deckId);
  if (error) throw new Error(error.message);
  return data;
};

const fetchCollection = async (userId) => {
  const { data, error } = await supabase
    .from("user_cards")
    .select("*")
    .eq("user_id", userId)
    .order("card_name");
  if (error) throw new Error(error.message);
  return data;
};

const fetchCardDetailsFromScryfall = async (cardsInDeck) => {
  if (!cardsInDeck || cardsInDeck.length === 0) return [];
  const identifiers = cardsInDeck.map((card) => ({ id: card.card_id }));
  const response = await fetch("https://api.scryfall.com/cards/collection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifiers }),
  });
  if (!response.ok)
    throw new Error("Falha ao buscar detalhes das cartas na Scryfall");
  const data = await response.json();
  return data.data;
};

export function DeckBuilderPage() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");

  const { data: deck, isLoading: isLoadingDeck } = useQuery({
    queryKey: ["deck", deckId, user?.id],
    queryFn: () => fetchDeckDetails(deckId, user.id),
    enabled: !!user,
  });

  const { data: deckCards, isLoading: isLoadingDeckCards } = useQuery({
    queryKey: ["deck_cards", deckId],
    queryFn: () => fetchDeckCards(deckId),
    enabled: !!deckId,
  });

  const { data: collection, isLoading: isLoadingCollection } = useQuery({
    queryKey: ["collection", user?.id],
    queryFn: () => fetchCollection(user.id),
    enabled: !!user,
  });

  const { data: fullCardDetails, isLoading: isLoadingFullDetails } = useQuery({
    queryKey: ["full_card_details", deckId, deckCards],
    queryFn: () => fetchCardDetailsFromScryfall(deckCards),
    enabled: !!deckCards && deckCards.length > 0,
  });

  const updateDeckCardMutation = useMutation({
    mutationFn: async ({ card, quantityChange }) => {
      const existingCardInDeck = deckCards?.find(
        (c) => c.card_id === card.card_id
      );
      const newQuantity = (existingCardInDeck?.quantity || 0) + quantityChange;
      if (newQuantity <= 0) {
        const { error } = await supabase
          .from("deck_cards")
          .delete()
          .eq("id", existingCardInDeck.id);
        if (error) throw error;
      } else if (existingCardInDeck) {
        const { error } = await supabase
          .from("deck_cards")
          .update({ quantity: newQuantity })
          .eq("id", existingCardInDeck.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("deck_cards")
          .insert({ deck_id: deckId, card_id: card.card_id, quantity: 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deck_cards", deckId] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar carta no deck:", error.message);
    },
  });

  const isLoading =
    isLoadingDeck ||
    isLoadingDeckCards ||
    isLoadingCollection ||
    isLoadingFullDetails;
  const totalDeckCards =
    deckCards?.reduce((sum, card) => sum + card.quantity, 0) || 0;

  const filteredCollection = collection?.filter((card) =>
    card.card_name.toLowerCase().includes(collectionSearchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">Carregando Deck Builder...</p>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <p className="text-2xl text-red-400 mb-4">Deck não encontrado.</p>
        <Link to="/decks">
          <Button className="bg-primary-500 hover:bg-primary-600">
            Voltar para Meus Decks
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4 flex flex-col">
      <div className="container mx-auto flex-grow">
        <Link
          to="/decks"
          className="text-primary-400 hover:text-primary-300 mb-6 inline-block"
        >
          &larr; Voltar para Meus Decks
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col">
            <h2
              className="text-2xl font-bold mb-4 text-center border-b border-slate-700 pb-3"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              Sua Coleção
            </h2>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Buscar na coleção..."
                value={collectionSearchTerm}
                onChange={(e) => setCollectionSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {filteredCollection?.map((cardInCollection) => {
                const quantityInDeck =
                  deckCards?.find(
                    (dc) => dc.card_id === cardInCollection.card_id
                  )?.quantity || 0;
                const isAddDisabled =
                  quantityInDeck >= cardInCollection.quantity ||
                  updateDeckCardMutation.isLoading;
                return (
                  <div
                    key={cardInCollection.card_id}
                    className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-14 flex-shrink-0 mr-3 border border-slate-600 rounded-sm overflow-hidden">
                        <img
                          src={cardInCollection.card_image_url}
                          alt={cardInCollection.card_name}
                          className="w-full h-full object-contain bg-slate-700"
                        />
                      </div>
                      <span className="text-slate-200 text-base">
                        {cardInCollection.quantity}x{" "}
                        {cardInCollection.card_name}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        updateDeckCardMutation.mutate({
                          card: cardInCollection,
                          quantityChange: 1,
                        })
                      }
                      disabled={isAddDisabled}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 disabled:bg-slate-600 disabled:opacity-50"
                    >
                      {isAddDisabled && quantityInDeck > 0
                        ? "Máx. no Deck"
                        : "Adicionar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col">
            <h1
              className="text-3xl font-bold mb-4 text-center border-b border-slate-700 pb-3"
              style={{ fontFamily: "Cinzel, serif" }}
            >
              {deck?.name}{" "}
              <span className="text-xl text-slate-400 ml-2">
                ({totalDeckCards} cartas)
              </span>
            </h1>
            <div className="mb-4 py-4">
              <h3 className="text-lg font-semibold text-center mb-2 text-slate-300">
                Curva de Mana
              </h3>
              <ManaCurveChart
                deckCards={deckCards}
                fullCardDetails={fullCardDetails}
              />
            </div>
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {deckCards && deckCards.length > 0 ? (
                deckCards.map((cardInDeck) => {
                  const cardDetails = fullCardDetails?.find(
                    (c) => c.id === cardInDeck.card_id
                  );
                  const cardInCollection = collection?.find(
                    (c) => c.card_id === cardInDeck.card_id
                  );
                  const maxQuantity = cardInCollection?.quantity || 0;
                  const isIncrementDisabled =
                    cardInDeck.quantity >= maxQuantity ||
                    updateDeckCardMutation.isLoading;
                  return (
                    <div
                      key={cardInDeck.id}
                      className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-slate-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-14 flex-shrink-0 mr-3 border border-slate-600 rounded-sm overflow-hidden">
                          <img
                            src={cardDetails?.image_uris?.small || ""}
                            alt={cardDetails?.name || "Carta"}
                            className="w-full h-full object-contain bg-slate-700"
                          />
                        </div>
                        <span className="text-slate-200 text-base">
                          {cardDetails?.name || "Carregando nome..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateDeckCardMutation.mutate({
                              card: { card_id: cardInDeck.card_id },
                              quantityChange: -1,
                            })
                          }
                          disabled={updateDeckCardMutation.isLoading}
                          className="bg-slate-700 hover:bg-slate-600 text-white text-sm w-8 h-8 rounded-full"
                        >
                          {" "}
                          -{" "}
                        </Button>
                        <span className="text-xl font-semibold text-primary-300 w-8 text-center">
                          {cardInDeck.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            updateDeckCardMutation.mutate({
                              card: { card_id: cardInDeck.card_id },
                              quantityChange: 1,
                            })
                          }
                          disabled={isIncrementDisabled}
                          className="bg-slate-700 hover:bg-slate-600 text-white text-sm w-8 h-8 rounded-full disabled:opacity-50"
                        >
                          {" "}
                          +{" "}
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400 text-center py-4">
                  Seu deck está vazio. Adicione cartas da sua coleção.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
