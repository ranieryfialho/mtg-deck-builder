import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { TRANSLATIONS } from '@/lib/translations.js';
import { SetFilter } from '@/components/search/SetFilter';

const COLORS = [
  { value: 'w', label: 'Branco', color: '#fffbd5' },
  { value: 'u', label: 'Azul', color: '#0e68ab' },
  { value: 'b', label: 'Preto', color: '#150b00' },
  { value: 'r', label: 'Vermelho', color: '#d3202a' },
  { value: 'g', label: 'Verde', color: '#00733e' }
];

// Funções auxiliares (translateQuery, buildScryfallQuery, searchCards) permanecem as mesmas
const translateQuery = (query) => {
  const normalized = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (TRANSLATIONS.cards[normalized]) return TRANSLATIONS.cards[normalized];
  return query;
};

const buildScryfallQuery = (textQuery, filters) => {
  let queryParts = [];
  if (textQuery) {
    const translated = translateQuery(textQuery);
    queryParts.push(`("${translated}" or "${textQuery}") include:foreign`);
  }
  if (filters.colors.length > 0) queryParts.push(`color>=${filters.colors.join('')}`);
  if (filters.type) queryParts.push(`type:${filters.type}`);
  if (filters.rarity) queryParts.push(`rarity:${filters.rarity}`);
  if (filters.cmc) queryParts.push(filters.cmc === '7+' ? `cmc>=7` : `cmc=${filters.cmc}`);
  if (filters.set) queryParts.push(`set:${filters.set}`);
  return queryParts.join(' ');
};

const searchCards = async (query, filters, page = 1) => {
  const scryfallQuery = buildScryfallQuery(query, filters);
  if (!scryfallQuery) return null;
  const searchUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&unique=cards&order=name&page=${page}`;
  const response = await fetch(searchUrl);
  if (!response.ok) throw new Error(`Nenhuma carta encontrada para os critérios selecionados.`);
  const data = await response.json();
  return { data: data.data || [], has_more: data.has_more || false, total_cards: data.total_cards || 0, page: page };
};


// --- NOVA LÓGICA DE ESTADO ---

// Função para ler o estado salvo do sessionStorage
const getInitialState = () => {
  const savedState = sessionStorage.getItem('mtgSearchState');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error("Falha ao ler o estado salvo:", e);
    }
  }
  // Estado padrão se nada for encontrado
  return {
    query: '',
    page: 1,
    filters: { colors: [], type: '', rarity: '', cmc: '', set: '' }
  };
};

export function SearchPage() {
  // Estado unificado para a busca
  const [searchState, setSearchState] = useState(getInitialState);
  // Estado local apenas para o campo de texto
  const [searchTerm, setSearchTerm] = useState(searchState.query);

  // Efeito para salvar o estado no sessionStorage sempre que ele mudar
  useEffect(() => {
    sessionStorage.setItem('mtgSearchState', JSON.stringify(searchState));
  }, [searchState]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['cards', searchState],
    queryFn: () => searchCards(searchState.query, searchState.filters, searchState.page),
    enabled: searchState.query !== '' || Object.values(searchState.filters).some(f => Array.isArray(f) ? f.length > 0 : f !== ''),
    retry: false,
    keepPreviousData: true
  });

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setSearchState(prev => ({ ...prev, query: searchTerm.trim(), page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0) {
      setSearchState(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSearchState(prev => ({
      ...prev,
      page: 1,
      filters: { ...prev.filters, [filterType]: value }
    }));
  };

  const handleColorToggle = (color) => {
    const newColors = searchState.filters.colors.includes(color)
      ? searchState.filters.colors.filter(c => c !== color)
      : [...searchState.filters.colors, color];
    handleFilterChange('colors', newColors);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchState({
      query: '',
      page: 1,
      filters: { colors: [], type: '', rarity: '', cmc: '', set: '' }
    });
  };

  const busy = isLoading || isFetching;
  const totalPages = data?.total_cards ? Math.ceil(data.total_cards / 176) : 0;
  
  // O resto do JSX continua o mesmo, apenas lendo do `searchState`

  return (
    <div className="w-full min-h-screen bg-slate-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center" style={{ fontFamily: 'Cinzel, serif' }}>BUSCAR CARTAS</h1>
        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6 max-w-xl mx-auto">
          <Input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome da carta..." className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={busy}>
            {busy ? 'Buscando...' : 'Buscar'}
          </Button>
        </form>
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cores</label>
              <div className="flex gap-1">
                {COLORS.map(color => (
                  <button key={color.value} onClick={() => handleColorToggle(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${searchState.filters.colors.includes(color.value) ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color.color, borderColor: searchState.filters.colors.includes(color.value) ? '#fff' : '#64748b' }} title={color.label} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select onChange={(e) => handleFilterChange('type', e.target.value)} value={searchState.filters.type} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                <option value="">Todos</option><option value="creature">Criatura</option><option value="planeswalker">Planeswalker</option><option value="instant">Instantânea</option><option value="sorcery">Feitiço</option><option value="enchantment">Encantamento</option><option value="artifact">Artefato</option><option value="land">Terreno</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Raridade</label>
              <select onChange={(e) => handleFilterChange('rarity', e.target.value)} value={searchState.filters.rarity} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                <option value="">Todas</option><option value="c">Comum</option><option value="u">Incomum</option><option value="r">Raro</option><option value="m">Mítico</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Custo Convertido</label>
              <select onChange={(e) => handleFilterChange('cmc', e.target.value)} value={searchState.filters.cmc} className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white">
                <option value="">Qualquer</option><option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7+">7+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Coleção</label>
              <SetFilter value={searchState.filters.set} onChange={(e) => handleFilterChange('set', e.target.value)} />
            </div>
          </div>
          {(searchState.query || Object.values(searchState.filters).some(f => Array.isArray(f) ? f.length > 0 : f !== '')) && (
            <Button onClick={clearFilters} className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1">Limpar Filtros</Button>
          )}
        </div>
        {busy && <div className="text-center py-8"><p>Buscando...</p></div>}
        {isError && !busy && <div className="text-center text-red-400 p-4">{error.message}</div>}
        {data && !busy && (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className='text-slate-400'>{data.total_cards.toLocaleString()} cartas encontradas</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => handlePageChange(searchState.page - 1)} disabled={searchState.page === 1}>Anterior</Button>
                  <span className="text-sm text-slate-400">Página {searchState.page} de {totalPages}</span>
                  <Button onClick={() => handlePageChange(searchState.page + 1)} disabled={!data.has_more}>Próxima</Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              {data.data.map((card) => (
                <Link to={`/card/${card.set}/${card.collector_number}`} key={card.id}>
                  <div className="relative group"><img src={card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal} alt={card.name} className="rounded-lg w-full" loading="lazy" /></div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button onClick={() => handlePageChange(searchState.page - 1)} disabled={searchState.page === 1}>Anterior</Button>
                <span className="text-sm text-slate-400">Página {searchState.page} de {totalPages}</span>
                <Button onClick={() => handlePageChange(searchState.page + 1)} disabled={!data.has_more}>Próxima</Button>
              </div>
            )}
          </>
        )}
        {!data && !busy && !isError && <div className="text-center py-12"><p className="text-slate-400">Use a busca e os filtros para encontrar cartas.</p></div>}
      </div>
    </div>
  );
}