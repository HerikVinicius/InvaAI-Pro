import { Boxes, AlertTriangle } from 'lucide-react';

function FilterCard({ label, value, icon: Icon, alert, mono }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className={`w-4 h-4 ${alert ? 'text-status-critical' : 'text-text-muted'}`} />}
      </div>
      <div className={`${mono ? 'data-mono' : 'text-sm'} ${alert ? 'text-status-critical' : 'text-accent'} font-semibold`}>
        {value}
      </div>
    </div>
  );
}

export default function InventorySummary({ total, criticalCount, warehouse }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FilterCard label="Local do Armazém" value={warehouse || 'Banco Principal'} />
      <FilterCard label="Status do Estoque" value="Todos os Status" />
      <FilterCard label="Total de SKU" value={total.toLocaleString()} icon={Boxes} mono />
      <FilterCard label="Alertas Críticos" value={`${criticalCount} Itens`} icon={AlertTriangle} alert mono />
    </div>
  );
}
