import { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import Button from '../ui/Button';

const todayISO = () => new Date().toISOString().slice(0, 10);

// Helper para presets em pt-BR — útil para descartar plumbing repetido.
const isoFor = (date) => date.toISOString().slice(0, 10);
const subtractDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const startOfMonth = (offset = 0) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
};
const endOfMonth = (offset = 0) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
};

const PRESETS = [
  { id: '7d',  label: 'Últimos 7 dias',  range: () => ({ from: isoFor(subtractDays(6)), to: todayISO() }) },
  { id: '30d', label: 'Últimos 30 dias', range: () => ({ from: isoFor(subtractDays(29)), to: todayISO() }) },
  { id: 'mes', label: 'Este mês',        range: () => ({ from: isoFor(startOfMonth(0)),  to: todayISO() }) },
  { id: 'mp',  label: 'Mês passado',     range: () => ({ from: isoFor(startOfMonth(-1)), to: isoFor(endOfMonth(-1)) }) },
];

export default function DateRangePicker({ value, onChange, onClear }) {
  const [from, setFrom] = useState(value?.from || '');
  const [to, setTo] = useState(value?.to || '');

  useEffect(() => {
    setFrom(value?.from || '');
    setTo(value?.to || '');
  }, [value?.from, value?.to]);

  const canApply = from && to && from <= to;

  const apply = () => {
    if (canApply) onChange({ from, to });
  };

  const applyPreset = (preset) => {
    const r = preset.range();
    setFrom(r.from);
    setTo(r.to);
    onChange(r);
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onClear?.();
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold">Período do Relatório</span>
        {value?.from && (
          <span className="ml-auto text-xs text-text-muted">
            {value.from} → {value.to}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
        />
        <span className="text-xs text-text-muted">até</span>
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={todayISO()}
          onChange={(e) => setTo(e.target.value)}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
        />
        <Button size="sm" onClick={apply} disabled={!canApply}>
          Aplicar
        </Button>
        {value?.from && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-status-critical"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
        <span className="text-[10px] uppercase tracking-wider text-text-muted mr-1">Atalhos:</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p)}
            className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-surface-hover transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
