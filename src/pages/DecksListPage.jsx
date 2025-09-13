import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditDeckModal } from "@/components/deck/EditDeckModal";

const fetchDecks = async (userId) => {
  const { data, error } = await supabase.from("decks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const createDeck = async ({ userId, name }) => {
  const { data, error } = await supabase.from("decks").insert({ user_id: userId, name: name }).select();
  if (error) throw new Error(error.message);
  return data;
};

const updateDeckName = async ({ deckId, newName }) => {
  const { error } = await supabase.from("decks").update({ name: newName }).eq("id", deckId);
  if (error) throw new Error(error.message);
};

const deleteDeck = async (deckId) => {
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) throw new Error(error.message);
};

export function DecksListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newDeckName, setNewDeckName] = useState("");
  const [editingDeck, setEditingDeck] = useState(null);

  const { data: decks, isLoading } = useQuery({
    queryKey: ["decks", user?.id],
    queryFn: () => fetchDecks(user.id),
    enabled: !!user,
  });

  const createDeckMutation = useMutation({
    mutationFn: createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", user?.id] });
      setNewDeckName("");
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: updateDeckName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", user?.id] });
      setEditingDeck(null);
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: deleteDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks", user?.id] });
    },
  });

  const handleCreateDeck = (e) => {
    e.preventDefault();
    if (newDeckName.trim() && user) {
      createDeckMutation.mutate({ userId: user.id, name: newDeckName.trim() });
    }
  };

  const handleSaveDeckName = (newName) => {
    if (newName.trim() && editingDeck) {
      updateDeckMutation.mutate({ deckId: editingDeck.id, newName: newName.trim() });
    }
  };

  const handleDeleteDeck = (deckId) => {
    if (window.confirm("Tem certeza que deseja remover este deck? Esta ação não pode ser desfeita.")) {
      deleteDeckMutation.mutate(deckId);
    }
  };

  return (
    <div className="w-full min-h-screen bg-primary-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center text-secondary-400" style={{ fontFamily: "Cinzel, serif" }}>
          Meus Decks
        </h1>

        <div className="max-w-md mx-auto mb-10 bg-primary-800/50 border border-primary-700 p-4 rounded-lg">
          <form onSubmit={handleCreateDeck} className="flex gap-2">
            <Input
              type="text" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Nome do novo deck"
              className="bg-primary-800 border-primary-600 focus:border-secondary-500 focus:ring-secondary-500"
              disabled={createDeckMutation.isLoading}
            />
            <Button
              type="submit"
              className="bg-secondary-500 hover:bg-secondary-600 text-secondary-foreground"
              disabled={createDeckMutation.isLoading}
            >
              {createDeckMutation.isLoading ? "Criando..." : "Criar Deck"}
            </Button>
          </form>
        </div>

        {isLoading && <p className="text-center">Carregando decks...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks?.map((deck) => (
            <div key={deck.id} className="bg-primary-800/50 border border-primary-700 p-4 rounded-lg flex flex-col justify-between transition-all hover:border-secondary-400 hover:shadow-lg hover:shadow-primary-900/50">
              <Link to={`/decks/${deck.id}`} className="flex-grow">
                <h2 className="text-xl font-bold truncate text-secondary-300 hover:text-secondary-400 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                  {deck.name}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Criado em: {new Date(deck.created_at).toLocaleDateString()}
                </p>
              </Link>
              <div className="flex gap-2 mt-4 pt-4 border-t border-primary-700">
                <Button
                  onClick={() => setEditingDeck(deck)}
                  variant="outline"
                  className="w-full"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => handleDeleteDeck(deck.id)}
                  variant="destructive"
                  className="w-full"
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <EditDeckModal
        deck={editingDeck}
        isOpen={!!editingDeck}
        onClose={() => setEditingDeck(null)}
        onSave={handleSaveDeckName}
      />
    </div>
  );
}