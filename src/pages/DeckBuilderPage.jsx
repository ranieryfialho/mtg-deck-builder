import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ManaCurveChart } from "@/components/deck/ManaCurveChart";
import { CardTypeChart } from "@/components/deck/CardTypeChart";

const fetchDeckDetails = async (deckId, userId) => {
  const { data, error } = await supabase.from("decks").select("*").eq("id", deckId).eq("user_id", userId).single();
  if (error) throw new Error(error.message);
  return data;
};

const fetchDeckCards = async (deckId) => {
  const { data, error } = await supabase.from("deck_cards").select("*").eq("deck_id", deckId);
  if (error) throw new Error(error.message);
  return data;
};

const fetchCollection = async (userId) => {
  const { data, error } = await supabase.from("user_cards").select("*").eq("user_id", userId).order("card_name");
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
  if (!response.ok) throw new Error("Falha ao buscar detalhes das cartas na Scryfall");
  const data = await response.json();
  return data.data;
};

const DeckCardList = ({ title, cards, allDeckCards, fullCardDetails, collection, onUpdate, mutationLoading }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2 border-b border-primary-700 pb-2">{title} ({cards.reduce((acc, c) => acc + c.quantity, 0)} Cartas)</h3>
      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
        {cards.length > 0 ? (
          cards.map((cardInDeck) => {
            const cardDetails = fullCardDetails?.find((c) => c.id === cardInDeck.card_id);
            const cardInCollection = collection?.find((c) => c.card_id === cardInDeck.card_id);
            const maxQuantity = cardInCollection?.quantity || 0;
            const totalInDeck = (allDeckCards || []).filter(c => c.card_id === cardInDeck.card_id).reduce((sum, c) => sum + c.quantity, 0);
            const isIncrementDisabled = totalInDeck >= maxQuantity || mutationLoading;
            const imageUrl = cardDetails?.image_uris?.small || null;

            return (
              <div key={cardInDeck.id || `${cardInDeck.card_id}-${cardInDeck.board}`} className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-primary-700 transition-colors">
                <div className="flex items-center min-w-0">
                  <div className="w-10 h-14 flex-shrink-0 mr-3 border border-primary-600 rounded-sm overflow-hidden bg-primary-900">
                    {imageUrl && <img src={imageUrl} alt={cardDetails?.name || "Carta"} className="w-full h-full object-contain" />}
                  </div>
                  <span className="text-slate-200 text-base truncate">{cardDetails?.name || "Carregando nome..."}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...cardInDeck }, -1)} disabled={mutationLoading} className="bg-primary-700 hover:bg-primary-600 text-white text-sm w-8 h-8 rounded-full"> - </Button>
                  <span className="text-xl font-semibold text-secondary-400 w-8 text-center">{cardInDeck.quantity}</span>
                  <Button size="sm" variant="ghost" onClick={() => onUpdate({ ...cardInDeck }, 1)} disabled={isIncrementDisabled} className="bg-primary-700 hover:bg-primary-600 text-white text-sm w-8 h-8 rounded-full disabled:opacity-50"> + </Button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-center py-4">Nenhuma carta aqui.</p>
        )}
      </div>
    </div>
  );
};


export function DeckBuilderPage() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");
  const [exportStatus, setExportStatus] = useState('idle');
  const deckCardsQueryKey = ["deck_cards", deckId];

  const { data: deck, isLoading: isLoadingDeck } = useQuery({ queryKey: ["deck", deckId, user?.id], queryFn: () => fetchDeckDetails(deckId, user.id), enabled: !!user });
  const { data: deckCards, isLoading: isLoadingDeckCards } = useQuery({ queryKey: deckCardsQueryKey, queryFn: () => fetchDeckCards(deckId), enabled: !!deckId });
  const { data: collection, isLoading: isLoadingCollection } = useQuery({ queryKey: ["collection", user?.id], queryFn: () => fetchCollection(user.id), enabled: !!user });
  const { data: fullCardDetails, isLoading: isLoadingFullDetails } = useQuery({ queryKey: ["full_card_details", deckId, deckCards], queryFn: () => fetchCardDetailsFromScryfall(deckCards), enabled: !!deckCards && deckCards.length > 0, keepPreviousData: true });

  const updateDeckCardMutation = useMutation({
    mutationFn: async ({ card, newQuantity, board }) => {
      if (newQuantity <= 0) {
        if (!card.id || String(card.id).startsWith('temp-')) return null;
        const { error } = await supabase.from("deck_cards").delete().eq("id", card.id);
        if (error) throw error;
        return { ...card, deleted: true };
      }
      if (card.id && !String(card.id).startsWith('temp-')) {
        const { data, error } = await supabase.from("deck_cards").update({ quantity: newQuantity }).eq("id", card.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase.from("deck_cards").insert({ deck_id: deckId, card_id: card.card_id, quantity: 1, board: board }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: deckCardsQueryKey });
      const previousDeckCards = queryClient.getQueryData(deckCardsQueryKey);
      queryClient.setQueryData(deckCardsQueryKey, (old = []) => {
        const { card, newQuantity, board } = variables;
        const existingCard = old.find(c => c.card_id === card.card_id && c.board === board);
        if (newQuantity <= 0) { return old.filter(c => c.id !== card.id); }
        if (existingCard) { return old.map(c => c.id === existingCard.id ? { ...c, quantity: newQuantity } : c); }
        return [...old, { ...card, quantity: 1, board: board, id: `temp-${Math.random()}` }];
      });
      return { previousDeckCards };
    },
    onError: (err, variables, context) => { queryClient.setQueryData(deckCardsQueryKey, context.previousDeckCards); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: deckCardsQueryKey }); },
  });

  const handleUpdateCardInDeck = (card, quantityChange) => {
    const newQuantity = card.quantity + quantityChange;
    if (quantityChange > 0) {
      const cardInCollection = collection.find(c => c.card_id === card.card_id);
      const maxQuantity = cardInCollection?.quantity || 0;
      const totalInDeck = (deckCards || []).filter(c => c.card_id === card.card_id).reduce((sum, c) => sum + c.quantity, 0);
      if (totalInDeck >= maxQuantity) {
        console.warn("Não é possível adicionar mais cópias do que o disponível na coleção.");
        return;
      }
    }
    updateDeckCardMutation.mutate({ card, newQuantity, board: card.board });
  };

  const handleAddCardToDeck = (cardInCollection, board) => {
    const totalInDeck = (deckCards || []).filter(c => c.card_id === cardInCollection.card_id).reduce((sum, c) => sum + c.quantity, 0);
    if (totalInDeck >= cardInCollection.quantity) {
      console.warn("Tentativa de adicionar mais cartas do que o disponível na coleção.");
      return;
    }
    const existingCard = deckCards?.find(c => c.card_id === cardInCollection.card_id && c.board === board);
    if (existingCard) {
      handleUpdateCardInDeck(existingCard, 1);
    } else {
      const cardToAdd = { card_id: cardInCollection.card_id, card_name: cardInCollection.card_name };
      updateDeckCardMutation.mutate({ card: cardToAdd, newQuantity: 1, board });
    }
  };

  const { mainboardCards, sideboardCards } = useMemo(() => {
    const mainboard = deckCards?.filter(c => c.board === 'mainboard') || [];
    const sideboard = deckCards?.filter(c => c.board === 'sideboard') || [];
    return { mainboardCards: mainboard, sideboardCards: sideboard };
  }, [deckCards]);

  const handleExport = () => {
    if (!deckCards || !fullCardDetails || deckCards.length === 0) return;
    const formatCardList = (list) => list.map(cardInDeck => {
      const details = fullCardDetails.find(d => d.id === cardInDeck.card_id);
      if (!details) return null;
      return `${cardInDeck.quantity} ${details.name} (${details.set.toUpperCase()}) ${details.collector_number}`;
    }).filter(Boolean).join('\n');
    let deckListText = "Deck\n" + formatCardList(mainboardCards);
    if (sideboardCards.length > 0) {
      deckListText += "\n\nSideboard\n" + formatCardList(sideboardCards);
    }
    navigator.clipboard.writeText(deckListText).then(() => {
      setExportStatus('copied');
      setTimeout(() => setExportStatus('idle'), 2000);
    });
  };

  const isInitialLoading = isLoadingDeck || isLoadingDeckCards || isLoadingCollection;
  const totalMainboardCards = mainboardCards.reduce((sum, card) => sum + card.quantity, 0);
  const totalSideboardCards = sideboardCards.reduce((sum, card) => sum + card.quantity, 0);
  const filteredCollection = collection?.filter((card) => card.card_name.toLowerCase().includes(collectionSearchTerm.toLowerCase()));

  if (isInitialLoading) {
    return <div className="w-full min-h-screen bg-primary-900 text-white flex items-center justify-center"><p className="text-xl">Carregando Deck Builder...</p></div>;
  }
  if (!deck) {
    return <div className="w-full min-h-screen bg-primary-900 text-white flex flex-col items-center justify-center p-4"><p className="text-2xl text-red-400 mb-4">Deck não encontrado.</p><Link to="/decks"><Button>Voltar para Meus Decks</Button></Link></div>;
  }

  return (
    <div className="w-full min-h-screen bg-primary-900 text-white p-4 flex flex-col">
      <div className="container mx-auto flex-grow">
        <div className="flex justify-between items-center mb-6">
          <Link to="/decks" className="text-secondary-400 hover:text-secondary-300 inline-block">&larr; Voltar para Meus Decks</Link>
          <Button onClick={handleExport} className={exportStatus === 'copied' ? 'bg-accent-emerald' : 'bg-secondary-500 hover:bg-secondary-600 text-secondary-foreground'}>
            {exportStatus === 'copied' ? 'Copiado!' : 'Exportar para Arena'}
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-primary-800/50 border border-primary-700 p-6 rounded-lg shadow-lg flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-center border-b border-primary-600 pb-3 text-secondary-300" style={{ fontFamily: "Cinzel, serif" }}>Sua Coleção</h2>
            <Input type="text" placeholder="Buscar na coleção..." value={collectionSearchTerm} onChange={(e) => setCollectionSearchTerm(e.target.value)} className="bg-primary-700 border-primary-600 mb-4" />
            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {filteredCollection?.map((cardInCollection) => {
                const qtyInMain = mainboardCards.find(dc => dc.card_id === cardInCollection.card_id)?.quantity || 0;
                const qtyInSide = sideboardCards.find(dc => dc.card_id === cardInCollection.card_id)?.quantity || 0;
                const totalInDeck = qtyInMain + qtyInSide;
                const canAddToDeck = totalInDeck < cardInCollection.quantity;
                return (
                  <div key={cardInCollection.id} className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-primary-700 transition-colors">
                    <div className="flex items-center min-w-0">
                      <img src={cardInCollection.card_image_url} alt={cardInCollection.card_name} className="w-10 h-14 flex-shrink-0 mr-3 border border-primary-600 rounded-sm object-contain bg-primary-900" />
                      <span className="text-slate-200 text-sm truncate">{cardInCollection.quantity}x {cardInCollection.card_name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleAddCardToDeck(cardInCollection, 'mainboard')} disabled={!canAddToDeck || updateDeckCardMutation.isLoading} className="bg-primary-600 hover:bg-primary-500 text-xs px-2 py-1 disabled:bg-slate-600">Deck</Button>
                      <Button size="sm" onClick={() => handleAddCardToDeck(cardInCollection, 'sideboard')} disabled={!canAddToDeck || updateDeckCardMutation.isLoading || totalSideboardCards >= 15} className="bg-accent-purple hover:bg-accent-purple/90 text-xs px-2 py-1 disabled:bg-slate-600">Side</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-2 bg-primary-800/50 border border-primary-700 p-6 rounded-lg shadow-lg flex flex-col">
            <h1 className="text-3xl font-bold mb-4 text-center border-b border-primary-600 pb-3 text-secondary-300" style={{ fontFamily: "Cinzel, serif" }}>
              {deck?.name} <span className="text-xl text-slate-400 ml-2">({totalMainboardCards} / {totalSideboardCards})</span>
            </h1>

            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-center mb-2 text-slate-300">Curva de Mana</h3>
                <ManaCurveChart deckCards={mainboardCards} fullCardDetails={fullCardDetails} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-center mb-2 text-slate-300">Tipos de Carta</h3>
                <CardTypeChart deckCards={mainboardCards} fullCardDetails={fullCardDetails} />
              </div>
            </div>

            <div className="space-y-6">
              <DeckCardList
                title="Deck Principal"
                cards={mainboardCards}
                allDeckCards={deckCards || []}
                fullCardDetails={fullCardDetails}
                collection={collection}
                onUpdate={handleUpdateCardInDeck}
                mutationLoading={updateDeckCardMutation.isLoading}
              />
              <DeckCardList
                title="Sideboard"
                cards={sideboardCards}
                allDeckCards={deckCards || []}
                fullCardDetails={fullCardDetails}
                collection={collection}
                onUpdate={handleUpdateCardInDeck}
                mutationLoading={updateDeckCardMutation.isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}