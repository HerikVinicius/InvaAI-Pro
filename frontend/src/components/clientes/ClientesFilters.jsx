import { Search } from 'lucide-react';

/**
 * Componente Presentacional: Filtros para Clientes
 * Recebe filtros e callbacks, renderiza controles
 */
export default function ClientesFilters({
  search = '',
  onSearchChange = () => {},
  onlyWithDebt = false,
  onFilterDebtChange = () => {},
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-background border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
        <input
          type="checkbox"
          checked={onlyWithDebt}
          onChange={(e) => onFilterDebtChange(e.target.checked)}
          className="accent-accent"
        />
        Apenas com débito
      </label>
    </div>
  );
}
