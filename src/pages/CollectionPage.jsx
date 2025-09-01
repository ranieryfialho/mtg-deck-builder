import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const fetchCollection = async (userId) => {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', userId)
    .order('card_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
};

export function CollectionPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: collection, isLoading, isError, error } = useQuery({
    queryKey: ['collection', user?.id],
    queryFn: () => fetchCollection(user.id),
    enabled: !!user,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ cardId, newQuantity }) => 
      supabase.rpc('update_card_quantity', { card_id_to_update: cardId, new_quantity: newQuantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', user?.id] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar a quantidade:", error.message);
    }
  });

  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => 
      supabase.from('user_cards').delete().eq('id', cardId).eq('user_id', user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', user?.id] });
    },
    onError: (error) => {
        console.error("Erro ao remover a carta:", error.message);
    }
  });

  const handleQuantityChange = (card, change) => {
    const newQuantity = card.quantity + change;
    if (newQuantity > 0) {
      updateQuantityMutation.mutate({ cardId: card.id, newQuantity });
    } else {
      handleDeleteCard(card.id);
    }
  };

  const handleDeleteCard = (cardId) => {
    if (window.confirm("Tem certeza que deseja remover esta carta da sua coleção?")) {
      deleteCardMutation.mutate(cardId);
    }
  };
  
  if (isLoading) {
    return <div className="text-center text-white p-10 min-h-screen bg-slate-900">Carregando sua coleção...</div>;
  }
  
  if (isError) {
    return <div className="text-center text-red-500 p-10 min-h-screen bg-slate-900">{error.message}</div>;
  }

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center" style={{ fontFamily: 'Cinzel, serif' }}>
          Minha Coleção
        </h1>

        {collection && collection.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {collection.map((card) => (
              <div key={card.id} className="bg-slate-800 rounded-lg shadow-lg flex flex-col overflow-hidden">
                <Link to={`/card/${card.set_code}/${card.collector_number}`}>
                  <img
                    src={card.card_image_url}
                    alt={card.card_name}
                    className="w-full object-contain transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </Link>
                <div className="p-4 flex-grow flex flex-col justify-between">
                    <h2 className="font-bold text-slate-200 truncate mb-4 h-6">{card.card_name}</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" 
                                onClick={() => handleQuantityChange(card, -1)}
                                disabled={updateQuantityMutation.isLoading || deleteCardMutation.isLoading}
                                className="bg-slate-700 w-8 h-8 rounded-full hover:bg-slate-600">-</Button>
                            <span className="text-lg font-semibold w-8 text-center text-primary-300">{card.quantity}</span>
                             <Button size="sm" variant="ghost" 
                                onClick={() => handleQuantityChange(card, 1)}
                                disabled={updateQuantityMutation.isLoading || deleteCardMutation.isLoading}
                                className="bg-slate-700 w-8 h-8 rounded-full hover:bg-slate-600">+</Button>
                        </div>
                        <Button size="sm" variant="destructive" 
                            onClick={() => handleDeleteCard(card.id)}
                            disabled={deleteCardMutation.isLoading || updateQuantityMutation.isLoading}>
                            Remover
                        </Button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">Sua coleção está vazia.</p>
            <p className="text-slate-500 mt-2">Use a busca para encontrar e adicionar suas cartas!</p>
            <Link to="/search">
                <Button className="mt-4 bg-primary-500 hover:bg-primary-600">
                    Buscar Cartas
                </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}