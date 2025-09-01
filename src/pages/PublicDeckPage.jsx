import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { ManaCurveChart } from '@/components/deck/ManaCurveChart';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// --- FUNÇÕES DE API ---
const fetchPublicDeckDetails = async (deckId) => {
  const { data, error } = await supabase.from('decks').select('*').eq('id', deckId).eq('is_public', true).single();
  if (error) throw new Error("Deck não encontrado ou não é público.");
  return data;
};

const fetchDeckCards = async (deckId) => {
  const { data, error } = await supabase.from('deck_cards').select('*').eq('deck_id', deckId);
  if (error) throw new Error(error.message);
  return data;
};

const fetchCardDetailsFromScryfall = async (cardsInDeck) => {
  if (!cardsInDeck || cardsInDeck.length === 0) return [];
  const identifiers = cardsInDeck.map(card => ({ id: card.card_id }));
  const response = await fetch('https://api.scryfall.com/cards/collection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifiers }),
  });
  if (!response.ok) throw new Error('Falha ao buscar detalhes das cartas na Scryfall');
  const data = await response.json();
  return data.data;
};

export function PublicDeckPage() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exportStatus, setExportStatus] = useState('idle');
  const [isMadePrivate, setIsMadePrivate] = useState(false);

  const { data: deck, isLoading: isLoadingDeck, error: deckError } = useQuery({
    queryKey: ['public_deck', deckId],
    queryFn: () => fetchPublicDeckDetails(deckId),
  });

  const { data: deckCards, isLoading: isLoadingDeckCards } = useQuery({
    queryKey: ['deck_cards', deckId],
    queryFn: () => fetchDeckCards(deckId),
    enabled: !!deck,
  });

  const { data: fullCardDetails, isLoading: isLoadingFullDetails } = useQuery({
    queryKey: ['full_card_details', deckId, deckCards],
    queryFn: () => fetchCardDetailsFromScryfall(deckCards),
    enabled: !!deckCards && deckCards.length > 0,
  });

  const cloneDeckMutation = useMutation({
    mutationFn: () => supabase.rpc('clone_deck', { deck_id_to_clone: deckId }),
    onSuccess: (result) => {
      if (result.error) {
        throw new Error(result.error.message);
      }
      alert('Deck copiado para sua conta com sucesso!');
      const newDeckId = result.data;
      queryClient.invalidateQueries({ queryKey: ['decks', user?.id] }); // Invalida a lista de decks
      navigate(`/decks/${newDeckId}`);
    },
    onError: (error) => {
      alert(`Erro ao copiar o deck: ${error.message}`);
    }
  });

  useEffect(() => {
    const channel = supabase.channel(`public_deck_${deckId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'decks', 
        filter: `id=eq.${deckId}` 
      }, 
      (payload) => {
        if (payload.new.is_public === false) {
          setIsMadePrivate(true);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [deckId]);

  const handleExport = () => {
    if (!deckCards || !fullCardDetails || deckCards.length === 0) return;
    const formatCardList = (list) => list.map(cardInDeck => {
        const details = fullCardDetails.find(d => d.id === cardInDeck.card_id);
        if (!details) return null;
        return `${cardInDeck.quantity} ${details.name} (${details.set.toUpperCase()}) ${details.collector_number}`;
    }).filter(Boolean).join('\n');
    const mainboard = deckCards.filter(c => c.board === 'mainboard');
    const sideboard = deckCards.filter(c => c.board === 'sideboard');
    let deckListText = "Deck\n" + formatCardList(mainboard);
    if (sideboard.length > 0) {
      deckListText += "\n\nSideboard\n" + formatCardList(sideboard);
    }
    navigator.clipboard.writeText(deckListText).then(() => {
      setExportStatus('copied');
      setTimeout(() => setExportStatus('idle'), 2000);
    });
  };

  const isLoading = isLoadingDeck || isLoadingDeckCards || isLoadingFullDetails;
  const totalDeckCards = deckCards?.reduce((sum, card) => sum + card.quantity, 0) || 0;

  if (isMadePrivate) {
    return (
      <div className="w-full min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <p className="text-2xl text-yellow-400 mb-4">Este deck se tornou privado.</p>
        <p className="text-slate-400">O proprietário alterou as configurações de compartilhamento.</p>
        <Link to="/"><Button className="mt-6 bg-primary-500 hover:bg-primary-600">Voltar para a Home</Button></Link>
      </div>
    );
  }

  if (isLoading) return <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center text-white"><p>Carregando Deck...</p></div>;
  if (deckError) return <div className="w-full min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-red-500">{deckError.message}</p></div>;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4 flex flex-col">
      <div className="container mx-auto">
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-start mb-2 pb-3 border-b border-slate-700">
            <div>
              <h1 className="text-3xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{deck.name}</h1>
              <p className="text-slate-400 text-sm">({totalDeckCards} cartas)</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && user.id !== deck.user_id && (
                <Button onClick={() => cloneDeckMutation.mutate()} disabled={cloneDeckMutation.isLoading} className="bg-green-600 hover:bg-green-700">
                  {cloneDeckMutation.isLoading ? 'Copiando...' : 'Copiar para Minha Conta'}
                </Button>
              )}
              <Button onClick={handleExport} className={exportStatus === 'copied' ? 'bg-green-600 hover:bg-green-700' : 'bg-secondary-500 hover:bg-secondary-600'}>
                {exportStatus === 'copied' ? 'Copiado!' : 'Exportar Para o Arena'}
              </Button>
            </div>
          </div>
          <div className="mb-4 py-4"><h3 className="text-lg font-semibold text-center mb-2 text-slate-300">Curva de Mana</h3><ManaCurveChart deckCards={deckCards} fullCardDetails={fullCardDetails} /></div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {fullCardDetails?.map(cardDetails => {
              const cardInDeck = deckCards.find(c => c.card_id === cardDetails.id);
              return (
                <div key={cardDetails.id} className="flex items-center justify-between mb-2 p-2 rounded-md hover:bg-slate-700 transition-colors">
                  <div className="flex items-center">
                    <div className="w-10 h-14 flex-shrink-0 mr-3 border border-slate-600 rounded-sm overflow-hidden">
                      <img src={cardDetails.image_uris?.small || cardDetails.card_faces?.[0]?.image_uris?.small} alt={cardDetails.name} className="w-full h-full object-contain bg-slate-700" />
                    </div>
                    <span className="text-slate-200">{cardDetails.name}</span>
                  </div>
                  <span className="text-xl font-semibold text-primary-300">{cardInDeck.quantity}x</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}