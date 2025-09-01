import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getCardBySetAndNumber = async (set, number, lang) => {
  const response = await fetch(`https://api.scryfall.com/cards/${set}/${number}/${lang}`);
  if (!response.ok && lang !== 'en') {
    const fallbackResponse = await fetch(`https://api.scryfall.com/cards/${set}/${number}/en`);
    if (!fallbackResponse.ok) throw new Error('Não foi possível encontrar a carta.');
    return fallbackResponse.json();
  }
  if (!response.ok) throw new Error('Não foi possível encontrar a carta.');
  return response.json();
};

const fetchCardInCollection = async (cardId, userId) => {
    if (!userId || !cardId) return null;
    const { data, error } = await supabase
        .from('user_cards')
        .select('quantity')
        .eq('user_id', userId)
        .eq('card_id', cardId)
        .single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
};

const supportedLanguages = [
  { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }, { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' }, { code: 'it', label: 'IT' }, { code: 'pt', label: 'PT' },
  { code: 'ja', label: 'JA' }, { code: 'ko', label: 'KO' }, { code: 'ru', label: 'RU' },
  { code: 'zhs', label: '汉语' }, { code: 'zht', label: '漢語' },
];

export function CardDetailPage() {
  const { set, number } = useParams();
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(0);
  const [updateStatus, setUpdateStatus] = useState('idle');

  const { data: card, isLoading: isLoadingCard } = useQuery({
    queryKey: ['card', set, number, language],
    queryFn: () => getCardBySetAndNumber(set, number, language),
  });

  const { data: cardInCollection } = useQuery({
    queryKey: ['collection_card', card?.id, user?.id],
    queryFn: () => fetchCardInCollection(card.id, user.id),
    enabled: !!card && !!user,
  });
  
  useEffect(() => {
    if (cardInCollection) {
      setQuantity(cardInCollection.quantity);
    } else {
      setQuantity(0);
    }
  }, [cardInCollection]);

  const upsertCardMutation = useMutation({
    mutationFn: async (newQuantity) => {
      const quantityNum = parseInt(newQuantity, 10);
      
      if (isNaN(quantityNum) || quantityNum < 0) return;
      if (quantityNum === 0) {
        const { error } = await supabase.from('user_cards').delete()
          .eq('user_id', user.id)
          .eq('card_id', card.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_cards').upsert({
          user_id: user.id,
          card_id: card.id,
          quantity: quantityNum,
          card_name: card.name,
          card_image_url: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal,
          set_code: card.set,
          collector_number: card.collector_number
        }, { onConflict: 'user_id, card_id' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setUpdateStatus('success');
      queryClient.invalidateQueries({ queryKey: ['collection_card', card.id, user.id] });
      queryClient.invalidateQueries({ queryKey: ['collection', user.id] });
      setTimeout(() => setUpdateStatus('idle'), 2000);
    },
    onError: (error) => {
        setUpdateStatus('error');
        console.error("Erro ao atualizar coleção:", error);
        setTimeout(() => setUpdateStatus('idle'), 2000);
    }
  });

  const handleUpdateCollection = () => {
    setUpdateStatus('loading');
    upsertCardMutation.mutate(quantity);
  };
  
  if (isLoadingCard) {
    return <div className="w-full min-h-screen bg-slate-900 text-white flex items-center justify-center">Carregando...</div>;
  }
  
  if (!card) {
    return <div className="w-full min-h-screen bg-slate-900 text-white flex items-center justify-center">Carta não encontrada.</div>;
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <button onClick={() => navigate(-1)} className="text-primary-400 hover:text-primary-300 mb-8 inline-block">&larr; Voltar</button>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <img src={card.image_uris?.large || card.card_faces?.[0].image_uris?.large} alt={card.name} className="rounded-xl w-full" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{card.printed_name || card.name}</h1>
            <div className="flex flex-wrap gap-1 border-b border-t border-slate-700 py-2">
              {supportedLanguages.map((lang) => (
                <Button key={lang.code} onClick={() => changeLanguage(lang.code)} variant={language === lang.code ? 'secondary' : 'ghost'} size="sm" className="text-xs">{lang.label}</Button>
              ))}
            </div>
            <p className="text-xl text-slate-300">{card.mana_cost}</p>
            <hr className="border-slate-600" />
            <p className="font-semibold text-lg">{card.printed_type_line || card.type_line}</p>
            <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">{card.printed_text || card.oracle_text}</div>
            {card.flavor_text && (<div className="text-slate-400 italic border-l-2 border-slate-600 pl-4">{card.flavor_text}</div>)}
            <div className="flex items-center space-x-4 text-lg">
              {card.power && card.toughness && (<p className="font-bold text-2xl">{card.power}/{card.toughness}</p>)}
              {card.prices?.usd && (<p className="text-green-400">USD: ${card.prices.usd}</p>)}
            </div>

            <div className="pt-4 border-t border-slate-700">
                <Label className="text-lg font-semibold text-slate-300">Na sua Coleção</Label>
                <div className="flex items-center gap-2 mt-2">
                    <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="bg-slate-700 border-slate-600 w-24"
                        min="0"
                    />
                    <Button 
                        onClick={handleUpdateCollection} 
                        disabled={upsertCardMutation.isLoading || updateStatus === 'loading'}
                        className={updateStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                    >
                        {updateStatus === 'loading' ? 'Salvando...' : (updateStatus === 'success' ? 'Salvo!' : 'Atualizar Coleção')}
                    </Button>
                </div>
                 {updateStatus === 'error' && <p className="text-red-400 text-sm mt-2">Ocorreu um erro ao salvar.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}