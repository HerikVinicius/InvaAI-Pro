import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

export default function ProfitDashboard({ profitDashboard, rangeLabel = '' }) {
  if (!profitDashboard) return null;

  const { faturamento, custoTotal, lucroLiquido, margemLucro } = profitDashboard;
  const margem = margemLucro ?? 0;
  const margemColor = margem >= 30 ? 'text-accent' : margem >= 15 ? 'text-amber-400' : 'text-status-critical';
  const margemBg = margem >= 30 ? 'bg-accent/10 border-accent/20' : margem >= 15 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-status-critical/10 border-status-critical/20';

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-accent" />
        <span className="label-caps text-accent">Dashboard de Lucros</span>
        <span className="ml-auto text-xs text-text-muted bg-surface-elevated border border-border rounded px-2 py-0.5">
          {rangeLabel || 'Mês atual'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wide">Faturamento</span>
            <DollarSign className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="font-mono text-xl font-semibold text-text-primary">{formatBRL(faturamento)}</div>
          <div className="text-xs text-text-muted mt-1">Receita total de vendas</div>
        </div>

        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wide">Custo Total</span>
            <ShoppingCart className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="font-mono text-xl font-semibold text-text-primary">{formatBRL(custoTotal)}</div>
          <div className="text-xs text-text-muted mt-1">Soma dos preços de custo</div>
        </div>

        <div className="bg-surface-elevated border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wide">Lucro Líquido</span>
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className={`font-mono text-xl font-semibold ${lucroLiquido >= 0 ? 'text-accent' : 'text-status-critical'}`}>
            {formatBRL(lucroLiquido)}
          </div>
          <div className="text-xs text-text-muted mt-1">Faturamento − Custo</div>
        </div>

        <div className={`border rounded-lg p-4 ${margemBg}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted uppercase tracking-wide">Margem de Lucro</span>
            <Percent className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className={`font-mono text-xl font-semibold ${margemColor}`}>{margem.toFixed(1)}%</div>
          <div className={`text-xs mt-1 ${margemColor}`}>
            {margem >= 30 ? 'Margem saudável' : margem >= 15 ? 'Margem moderada' : 'Margem baixa'}
          </div>
        </div>
      </div>
    </div>
  );
}
