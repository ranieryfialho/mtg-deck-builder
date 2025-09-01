import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const fetchDecks = async (userId) => {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const createDeck = async ({ userId, name }) => {
  const { data, error } = await supabase
    .from('decks')
    .insert({ user_id: userId, name: name })
    .select();
  if (error) throw new Error(error.message);
  return data;
};

export function DecksListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newDeckName, setNewDeckName] = useState('');

  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks', user?.id],
    queryFn: () => fetchDecks(user.id),
    enabled: !!user,
  });

  const createDeckMutation = useMutation({
    mutationFn: createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks', user?.id] });
      setNewDeckName('');
    },
  });

  const handleCreateDeck = (e) => {
    e.preventDefault();
    if (newDeckName.trim() && user) {
      createDeckMutation.mutate({ userId: user.id, name: newDeckName.trim() });
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center" style={{ fontFamily: 'Cinzel, serif' }}>
          Meus Decks
        </h1>

        <div className="max-w-md mx-auto mb-8 bg-slate-800 p-4 rounded-lg">
          <form onSubmit={handleCreateDeck} className="flex gap-2">
            <Input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Nome do novo deck"
              className="bg-slate-700 border-slate-600"
              disabled={createDeckMutation.isLoading}
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createDeckMutation.isLoading}>
              {createDeckMutation.isLoading ? 'Criando...' : 'Criar Deck'}
            </Button>
          </form>
        </div>

        {isLoading && <p className="text-center">Carregando decks...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks?.map((deck) => (
            <Link to={`/decks/${deck.id}`} key={deck.id}>
              <div className="bg-slate-800 p-4 rounded-lg hover:bg-slate-700 transition-colors">
                <h2 className="text-xl font-bold truncate">{deck.name}</h2>
                <p className="text-sm text-slate-400">
                  Criado em: {new Date(deck.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}