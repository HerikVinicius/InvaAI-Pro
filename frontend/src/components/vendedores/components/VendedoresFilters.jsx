import { useState, useEffect, useRef } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

const DESEMPENHO_NIVEIS = [
  { value: 'todos', label: 'Nível: Todos' },
  { value: 'alto', label: 'Alto (≥ 80%)' },
  { value: 'medio', label: 'Médio (40–79%)' },
  { value: 'baixo', label: 'Baixo (< 40%)' },
];

const STATUS_OPCOES = [
  { value: 'ativos', label: 'Ativos' },
  { value: 'inativos', label: 'Inativos' },
  { value: 'todos', label: 'Todos' },
];

function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find((o) => o.value === value)?.label || options[0]?.label;

  return (
    <div ref={ref} className="flex flex-col relative">
      <span className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{label}</span>
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-background border border-border rounded px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-surface-hover min-w-[140px]"
      >
        <span className="flex-1 text-left">{current}</span>
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 bg-surface border border-border rounded-lg shadow-lg min-w-[160px] py-1 animate-slide-down">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
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

export default function VendedoresFilters({
  filtroRegiao = 'todas',
  filtroDesempenho = 'todos',
  filtroStatus = 'ativos',
  onFiltroRegiao = () => {},
  onFiltroDesempenho = () => {},
  onFiltroStatus = () => {},
  regioes = [],
  onLimparFiltros = () => {},
}) {
  const regiaoOptions = regioes.map((r) => ({
    value: r,
    label: r === 'todas' ? 'Todas as Regiões' : r,
  }));

  return (
    <div className="bg-surface border border-border rounded-lg p-4 flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Filter className="w-3.5 h-3.5" />
        <span>Filtros</span>
      </div>

      <FilterDropdown
        label="Região"
        value={filtroRegiao}
        onChange={onFiltroRegiao}
        options={regiaoOptions}
      />
      <FilterDropdown
        label="Desempenho"
        value={filtroDesempenho}
        onChange={onFiltroDesempenho}
        options={DESEMPENHO_NIVEIS}
      />
      <FilterDropdown
        label="Status"
        value={filtroStatus}
        onChange={onFiltroStatus}
        options={STATUS_OPCOES}
      />

      <button
        onClick={onLimparFiltros}
        className="ml-auto text-xs text-text-muted hover:text-text-primary transition-colors"
      >
        Limpar Filtros
      </button>
    </div>
  );
}
