import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const FilterSection = ({ title, children }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-sm font-semibold text-slate-300">{title}</Label>
    {children}
  </div>
);

export function FilterPanel({ filters, setFilters }) {

  const handleColorChange = (newColors) => {
    setFilters(prev => ({ ...prev, colors: newColors }));
  };

  const handleTypeChange = (newType) => {
    setFilters(prev => ({ ...prev, type: newType === 'all' ? '' : newType }));
  };

  const handleRarityChange = (newRarity) => {
    setFilters(prev => ({ ...prev, rarity: newRarity === 'all' ? '' : newRarity }));
  };

  return (
    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <FilterSection title="Cores">
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={filters.colors}
            onValueChange={handleColorChange}
            className="justify-start"
          >
            <ToggleGroupItem value="W" aria-label="Branco">⚪</ToggleGroupItem>
            <ToggleGroupItem value="U" aria-label="Azul">🔵</ToggleGroupItem>
            <ToggleGroupItem value="B" aria-label="Preto">⚫</ToggleGroupItem>
            <ToggleGroupItem value="R" aria-label="Vermelho">🔴</ToggleGroupItem>
            <ToggleGroupItem value="G" aria-label="Verde">🟢</ToggleGroupItem>
          </ToggleGroup>
        </FilterSection>

        <FilterSection title="Tipo">
          <Select value={filters.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600">
              <SelectValue placeholder="Qualquer tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer tipo</SelectItem>
              <SelectItem value="creature">Criatura</SelectItem>
              <SelectItem value="planeswalker">Planeswalker</SelectItem>
              <SelectItem value="instant">Mágica Instantânea</SelectItem>
              <SelectItem value="sorcery">Feitiço</SelectItem>
              <SelectItem value="enchantment">Encantamento</SelectItem>
              <SelectItem value="artifact">Artefato</SelectItem>
              <SelectItem value="land">Terreno</SelectItem>
            </SelectContent>
          </Select>
        </FilterSection>

        <FilterSection title="Raridade">
          <Select value={filters.rarity} onValueChange={handleRarityChange}>
            <SelectTrigger className="bg-slate-700 border-slate-600">
              <SelectValue placeholder="Qualquer raridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer raridade</SelectItem>
              <SelectItem value="c">Comum</SelectItem>
              <SelectItem value="u">Incomum</SelectItem>
              <SelectItem value="r">Raro</SelectItem>
              <SelectItem value="m">Mítico Raro</SelectItem>
            </SelectContent>
          </Select>
        </FilterSection>

      </div>
    </div>
  );
}