import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export default function DashboardSummary({ inventory = {}, salesTeam = {}, sales = {} }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Resumo Operacional</h3>
        <Link to="/inventory" className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1">
          Ver Inventário <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="text-sm text-text-secondary">
        <span className="font-mono text-status-critical">{inventory.criticalAlerts || 0}</span> alerta{(inventory.criticalAlerts || 0) === 1 ? '' : 's'} de estoque
        <span className="font-mono text-text-secondary mx-2">·</span>
        <span className="font-mono">{salesTeam.activeSalespersons || 0}</span> de {salesTeam.totalSalespersons || 0} vendedor{(salesTeam.totalSalespersons || 0) === 1 ? '' : 'es'} ativo{(salesTeam.activeSalespersons || 0) === 1 ? '' : 's'}
        <span className="font-mono text-text-secondary mx-2">·</span>
        <span className="font-mono text-accent">{formatBRL(sales.receitaMesAtual)}</span> este mês
      </div>
    </div>
  );
}
