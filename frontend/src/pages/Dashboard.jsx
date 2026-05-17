import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays } from 'lucide-react';
import { useDashboardSummary, useSalesTrend, buildDateRange } from '../hooks/useDashboardFetch';
import { SkeletonCard } from '../components/ui/Skeleton';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import DashboardTrendChart from '../components/dashboard/DashboardTrendChart';
import DashboardInsights from '../components/dashboard/DashboardInsights';
import DashboardSummary from '../components/dashboard/DashboardSummary';
import ProfitDashboard from '../components/dashboard/ProfitDashboard';

const PRESETS = [
  { key: 'mesAtual', label: 'Mês atual' },
  { key: 'hoje',     label: 'Hoje' },
  { key: '7dias',    label: 'Últimos 7 dias' },
  { key: 'personalizado', label: 'Personalizado' },
];

export default function Dashboard() {
  const [preset, setPreset] = useState('mesAtual');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [showCustom, setShowCustom] = useState(false);

  const range = buildDateRange(preset, custom);

  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useDashboardSummary(range);
  const { data: trendData,   isLoading: trendLoading,   error: trendError   } = useSalesTrend(range);

  useEffect(() => {
    if (summaryError) toast.error('Falha ao carregar dados do dashboard.');
    if (trendError)   toast.error('Falha ao carregar tendência de vendas.');
  }, [summaryError, trendError]);

  const handlePreset = (key) => {
    setPreset(key);
    setShowCustom(key === 'personalizado');
  };

  const loading = summaryLoading || trendLoading;
  const data = summaryData || { inventory: {}, salesTeam: {}, sales: {} };
  const salesTrend = trendData?.trend || [];

  const inv   = data?.inventory   || {};
  const team  = data?.salesTeam   || {};
  const sales = data?.sales       || {};
  const variacao = sales.variacaoReceita || 0;
  const profitDashboard = data?.profitDashboard ?? null;

  const presetLabel = PRESETS.find(p => p.key === preset)?.label || '';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Seletor de período */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarDays className="w-4 h-4 text-text-muted flex-shrink-0" />
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => handlePreset(p.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                preset === p.key
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-subtle'
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset !== 'personalizado' && (
            <span className="text-xs text-text-muted ml-1">
              {range.from} → {range.to}
            </span>
          )}
        </div>

        {/* Inputs de data personalizada */}
        {showCustom && (
          <div className="flex items-center gap-3 flex-wrap pl-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">De</label>
              <input
                type="date"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-text-muted">até</label>
              <input
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      ) : (
        <>
          <DashboardMetrics sales={sales} inventory={inv} variacao={variacao} rangeLabel={presetLabel} />

          {profitDashboard && <ProfitDashboard profitDashboard={profitDashboard} rangeLabel={presetLabel} />}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <DashboardTrendChart salesTrend={salesTrend} range={range} />
            <DashboardInsights inventory={inv} salesTeam={team} />
          </div>

          <DashboardSummary inventory={inv} salesTeam={team} sales={sales} />
        </>
      )}
    </div>
  );
}
