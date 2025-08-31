import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { FilterPanel } from '@/components/search/FilterPanel';
import { TRANSLATIONS } from '@/lib/translations.js';

const normalizeText = (text) => {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
};

const translateQuery = (query) => {
  const normalized = normalizeText(query);
  if (TRANSLATIONS.cards[normalized]) {
    return TRANSLATIONS.cards[normalized];
  }
  const withoutArticles = normalized.replace(/^(o|a|os|as|um|uma)\s+/, '');
  if (TRANSLATIONS.cards[withoutArticles]) {
    return TRANSLATIONS.cards[withoutArticles];
  }
  const words = normalized.split(/\s+/);
  const translated = words.map(word => {
    if (['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'com', 'para', 'por', 'em', 'na', 'no'].includes(word)) return '';
    return TRANSLATIONS.mechanics[word] || TRANSLATIONS.actions[word] || TRANSLATIONS.types[word] || TRANSLATIONS.subtypes[word] || word;
  });
  return translated.filter(w => w !== '').join(' ');
};

const buildScryfallQuery = (textQuery, filters) => {
  let queryParts = [];
  if (textQuery) {
    const translated = translateQuery(textQuery);
    queryParts.push(`("${translated}" or "${textQuery}") include:foreign`);
  }
  if (filters.colors.length > 0) {
    queryParts.push(`color>=${filters.colors.join('')}`);
  }
  if (filters.type) {
    queryParts.push(`type:${filters.type}`);
  }
  if (filters.rarity) {
    queryParts.push(`rarity:${filters.rarity}`);
  }
  if (queryParts.length === 0) return '';
  return queryParts.join(' ');
};

const fetchAllPages = async (url) => {
  let allCards = [];
  let currentUrl = url;
  while (currentUrl) {
    const response = await fetch(currentUrl);
    if (!response.ok) break;
    const data = await response.json();
    allCards = [...allCards, ...data.data];
    currentUrl = data.has_more ? data.next_page : null;
  }
  return allCards.length > 0 ? { data: allCards, has_more: !!currentUrl, total_cards: allCards.length } : null;
};

const searchCards = async (query, filters) => {
  const scryfallQuery = buildScryfallQuery(query, filters);
  if (!scryfallQuery) return null;

  const searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=cards&order=name`;
  const result = await fetchAllPages(searchUrl);

  if (!result) {
    throw new Error(`Nenhuma carta encontrada para os critérios selecionados.`);
  }
  return result;
};

export function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [queryToSearch, setQueryToSearch] = useState('');
  const [filters, setFilters] = useState({
    colors: [],
    type: '',
    rarity: '',
  });

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['cards', queryToSearch, filters],
    queryFn: () => searchCards(queryToSearch, filters),
    enabled: queryToSearch !== '' || filters.colors.length > 0 || filters.type !== '' || filters.rarity !== '',
    retry: false,
  });

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setQueryToSearch(searchTerm.trim());
  };
  
  const busy = isLoading || isFetching;

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center" style={{ fontFamily: 'Cinzel, serif' }}>
          Buscar Cartas
        </h1>
        
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6 max-w-xl mx-auto">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome, mecânica ou tipo (PT/EN)"
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={busy}>
            {busy ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>

        <FilterPanel filters={filters} setFilters={setFilters} />

        {busy && <p className="text-center">Buscando...</p>}
        
        {isError && !busy && (
          <div className="text-center text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            {error.message}
          </div>
        )}
        
        {data && !busy && (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center bg-slate-800 rounded-lg px-4 py-2">
                <span className="text-slate-400 mr-2">Encontradas</span>
                <span className="text-white font-bold text-xl">{data.total_cards}</span>
                <span className="text-slate-400 ml-2">cartas</span>
                {data.has_more && <span className="text-yellow-400 ml-2 text-sm">(+ disponíveis)</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.data.map((card) => (
                <Link to={`/card/${card.set}/${card.collector_number}`} key={card.id}>
                  <div className="relative group">
                    <img
                      src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal}
                      alt={card.name}
                      className="rounded-lg w-full transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}