import { useQuery } from '@tanstack/react-query';

const fetchSets = async () => {
  const response = await fetch('https://api.scryfall.com/sets');
  if (!response.ok) {
    throw new Error('Não foi possível carregar as coleções.');
  }
  const data = await response.json();
  return data.data
    .filter(set => ['core', 'expansion', 'masters', 'commander', 'planechase', 'draft_innovation', 'masterpiece'].includes(set.set_type))
    .sort((a, b) => new Date(b.released_at) - new Date(a.released_at));
};

export function SetFilter({ value, onChange }) {
  const { data: sets, isLoading, isError } = useQuery({
    queryKey: ['sets'],
    queryFn: fetchSets,
    staleTime: 1000 * 60 * 60 * 24, // Cache de 24 horas
  });

  const selectClassName = "w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white";

  if (isLoading) return <select disabled className={selectClassName}><option>Carregando...</option></select>;
  if (isError) return <select disabled className={`${selectClassName} text-red-400`}><option>Erro ao carregar</option></select>;

  return (
    <select
      value={value}
      onChange={onChange}
      className={selectClassName}
    >
      <option value="">Todas as Coleções</option>
      {sets?.map(set => (
        <option key={set.id} value={set.code}>
          {set.name}
        </option>
      ))}
    </select>
  );
}