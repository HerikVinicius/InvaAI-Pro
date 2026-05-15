import { Users, Wallet, Award } from 'lucide-react';

function SummaryCard({ label, value, icon: Icon, subline }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="label-caps">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-text-muted" />}
      </div>
      <div className="font-mono text-xl font-semibold mb-1">{value}</div>
      {subline && <div>{subline}</div>}
    </div>
  );
}

export default function VendedoresSummary({ summary = {}, activeCount = 0, inactiveCount = 0 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SummaryCard
        label="Total de Vendedores"
        value={activeCount + inactiveCount}
        icon={Users}
        subline={
          <span className="text-xs text-text-secondary">
            <span className="text-accent">{activeCount} Ativos</span> /{' '}
            <span className="text-status-critical">{inactiveCount} Inativos</span>
          </span>
        }
      />
      <SummaryCard
        label="Volume Total Realizado"
        value={`R$ ${(summary.totalSales || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon={Wallet}
        subline={<span className="text-xs text-text-secondary">Soma das vendas concluídas</span>}
      />
      {summary.topPerformer && (summary.topPerformer.salesRealized || 0) > 0 ? (
        <div className="bg-surface border border-border rounded-lg p-4 ring-1 ring-accent/40">
          <div className="flex items-center justify-between mb-2">
            <span className="label-caps">Top Performer</span>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <div className="text-sm font-semibold text-text-primary">{summary.topPerformer.name}</div>
          <div className="text-xs text-accent mt-1">
            R$ {(summary.topPerformer.salesRealized || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vendidos
            {summary.topPerformer.salesTarget > 0 && ` · ${summary.topPerformer.achievementPercentage}% da meta`}
          </div>
        </div>
      ) : (
        <SummaryCard label="Top Performer" value="—" icon={Award} subline="Nenhuma venda registrada ainda" />
      )}
    </div>
  );
}
