import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useDashboardSummary, useSalesTrend } from '../hooks/useDashboardFetch';
import { SkeletonCard } from '../components/ui/Skeleton';
import DashboardMetrics from '../components/dashboard/DashboardMetrics';
import DashboardTrendChart from '../components/dashboard/DashboardTrendChart';
import DashboardInsights from '../components/dashboard/DashboardInsights';
import DashboardSummary from '../components/dashboard/DashboardSummary';

export default function Dashboard() {
  const { data: summaryData, isLoading: summaryLoading, error: summaryError } = useDashboardSummary();
  const { data: trendData, isLoading: trendLoading, error: trendError } = useSalesTrend(6);

  useEffect(() => {
    if (summaryError) toast.error('Falha ao carregar dados do dashboard.');
    if (trendError) toast.error('Falha ao carregar tendência de vendas.');
  }, [summaryError, trendError]);

  const loading = summaryLoading || trendLoading;
  const data = summaryData || { inventory: {}, salesTeam: {}, sales: {} };
  const salesTrend = trendData?.trend || [];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const inv = data?.inventory || {};
  const team = data?.salesTeam || {};
  const sales = data?.sales || {};
  const variacao = sales.variacaoReceita || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <DashboardMetrics sales={sales} inventory={inv} variacao={variacao} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardTrendChart salesTrend={salesTrend} />
        <DashboardInsights inventory={inv} salesTeam={team} />
      </div>

      <DashboardSummary inventory={inv} salesTeam={team} sales={sales} />
    </div>
  );
}
