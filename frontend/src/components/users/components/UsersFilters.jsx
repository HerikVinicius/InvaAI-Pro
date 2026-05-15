import { useState, useEffect } from 'react';
import { Filter, Search, X, ChevronDown } from 'lucide-react';

function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value)?.label || options[0]?.label;

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-dropdown]')) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div data-dropdown className="flex flex-col relative">
      <span className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{label}</span>
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-background border border-border rounded px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface-hover min-w-[160px]"
      >
        <span className="flex-1 text-left">{current}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-surface border border-border rounded-lg shadow-lg min-w-[180px] max-h-64 overflow-y-auto py-1 animate-slide-down">
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors ${
                value === opt.value ? 'text-accent font-semibold' : 'text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UsersFilters({
  search,
  onSearchChange,
  filtroTenant,
  onFilterTenantChange,
  filtroRole,
  onFilterRoleChange,
  tenants,
  isMaster,
  onClearFilters,
}) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome ou @username..."
          className="w-full bg-background border border-border rounded-md pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-accent"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtros</span>
        </div>
        <FilterDropdown
          label="Tenant"
          value={filtroTenant}
          onChange={onFilterTenantChange}
          options={tenants.map(t => ({ value: t, label: t === 'todos' ? 'Todos os Tenants' : t }))}
        />
        <FilterDropdown
          label="Função"
          value={filtroRole}
          onChange={onFilterRoleChange}
          options={[
            { value: 'todos',    label: 'Todas as Funções' },
            ...(isMaster ? [{ value: 'master', label: 'Master' }, { value: 'admin', label: 'Admin' }] : []),
            { value: 'lojista',  label: 'Lojista'  },
            { value: 'gerente',  label: 'Gerente'  },
            { value: 'vendedor', label: 'Vendedor' },
          ]}
        />
        <button
          onClick={onClearFilters}
          className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
