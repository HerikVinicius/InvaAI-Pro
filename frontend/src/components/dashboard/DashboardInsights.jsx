import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, TrendingUp, Award } from 'lucide-react';
import Button from '../ui/Button';

const formatBRL = (value) =>
  (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function InsightCard({ icon: Icon, tone, title, body }) {
  const tones = {
    critical: 'bg-status-critical-bg border-status-critical/30 text-status-critical',
    accent: 'bg-accent/5 border-accent/30 text-accent',
  };
  return (
    <div className={`border rounded-md p-3 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold">{title}</span>
      </div>
      <p className="text-xs text-text-secondary">{body}</p>
    </div>
  );
}

export default function DashboardInsights({ inventory = {}, salesTeam = {} }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold">Insights</h3>
      </div>
      <div className="space-y-3">
        <InsightCard
          icon={AlertTriangle}
          tone="critical"
          title={`${inventory.criticalCount || 0} SKUs críticos`}
          body="Itens com estoque zero ou próximo a zero precisam de reposição."
        />
        <InsightCard
          icon={TrendingUp}
          tone="accent"
          title={`${inventory.lowStockCount || 0} itens com baixo estoque`}
          body="Reponha antes que os níveis caiam abaixo do limite."
        />
        {salesTeam.topPerformer && (
          <InsightCard
            icon={Award}
            tone="accent"
            title={`Top: ${salesTeam.topPerformer.name}`}
            body={`${formatBRL(salesTeam.topPerformer.totalVendido)} em ${salesTeam.topPerformer.quantidadeVendas} venda${salesTeam.topPerformer.quantidadeVendas === 1 ? '' : 's'}.`}
          />
        )}
      </div>
      <Link to="/ai-insights" className="mt-4 block">
        <Button variant="ghost" className="w-full">Ver Previsão Detalhada</Button>
      </Link>
    </div>
  );
}
