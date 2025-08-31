import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

const getCardBySetAndNumber = async (set, number, lang) => {
  let response = await fetch(`https://api.scryfall.com/cards/${set}/${number}/${lang}`);
  
  if (!response.ok && lang !== 'en') {
    response = await fetch(`https://api.scryfall.com/cards/${set}/${number}/en`);
  }

  if (!response.ok) {
    throw new Error('Não foi possível encontrar a carta neste idioma.');
  }
  
  return response.json();
};

const supportedLanguages = [
  { code: 'en', label: 'EN' }, { code: 'es', label: 'ES' }, { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' }, { code: 'it', label: 'IT' }, { code: 'pt', label: 'PT' },
  { code: 'ja', label: 'JA' }, { code: 'ko', label: 'KO' }, { code: 'ru', label: 'RU' },
  { code: 'zhs', label: '汉语' }, { code: 'zht', label: '漢語' },
];

export function CardDetailPage() {
  const { set, number } = useParams();
  const { language, changeLanguage } = useLanguage();

  const { data: card, isLoading, isError, error } = useQuery({
    queryKey: ['card', set, number, language],
    queryFn: () => getCardBySetAndNumber(set, number, language),
    retry: false,
  });

  if (isLoading) {
    return <div className="text-center text-white p-10 min-h-screen bg-slate-900">Carregando detalhes da carta...</div>;
  }

  if (isError) {
    return (
       <div className="text-center text-red-500 p-10 min-h-screen bg-slate-900">
         <p>{error.message}</p>
         <p className="mt-2 text-slate-400">Esta carta pode não ter uma impressão disponível no idioma selecionado.</p>
         <Link to="/search" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
            &larr; Voltar para a busca
         </Link>
       </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen text-white p-4 sm:p-8">
      <div className="container mx-auto">
        <Link to="/search" className="text-primary-400 hover:text-primary-300 mb-8 inline-block">
          &larr; Voltar para a busca
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md-col-span-1">
            <img
              src={card.image_uris?.large || card.card_faces?.[0].image_uris?.large}
              alt={card.name}
              className="rounded-xl w-full"
            />
          </div>
          <div className="md-col-span-2 space-y-4">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
              {card.printed_name || card.name}
            </h1>
            <div className="flex flex-wrap gap-1 border-b border-t border-slate-700 py-2">
              {supportedLanguages.map((lang) => (
                <Button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  variant={language === lang.code ? 'secondary' : 'ghost'}
                  size="sm"
                  className="text-xs"
                >
                  {lang.label}
                </Button>
              ))}
            </div>
            <p className="text-xl text-slate-300">{card.mana_cost}</p>
            <hr className="border-slate-600" />
            <p className="font-semibold text-lg">{card.printed_type_line || card.type_line}</p>
            <div className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
              {card.printed_text || card.oracle_text}
            </div>
            {card.flavor_text && (
              <div className="text-slate-400 italic border-l-2 border-slate-600 pl-4">{card.flavor_text}</div>
            )}
            <div className="flex items-center space-x-4 text-lg">
              {card.power && card.toughness && (<p className="font-bold text-2xl">{card.power}/{card.toughness}</p>)}
              {card.prices?.usd && (<p className="text-green-400">USD: ${card.prices.usd}</p>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}