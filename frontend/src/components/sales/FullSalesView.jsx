import { RefreshCw } from 'lucide-react';
import { useSalesData } from '../../hooks/useSalesData';
import DateRangePicker from './DateRangePicker';
import SalesMetricsCards from './components/SalesMetricsCards';
import SalesTrendChart from './components/SalesTrendChart';
import SalesPaymentBreakdown from './components/SalesPaymentBreakdown';
import SalesRecentList from './components/SalesRecentList';
import SalesVendorRanking from './components/SalesVendorRanking';
import { SkeletonCard } from '../ui/Skeleton';

export default function FullSalesView() {
  const {
    summary,
    stats,
    trend,
    trendGranularity,
    vendas,
    topVendedores,
    paymentBreakdown,
    loading,
    refreshing,
    range,
    setRange,
    fetchData,
  } = useSalesData();

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  const sales = summary?.sales || {};
  const periodoStats = range ? (stats?.periodo || stats?.mesAtual) : null;

  const receitaTotal = range
    ? (periodoStats?.receita || 0)
    : (sales.receitaTotal || 0);
  const unidadesTotais = range
    ? (periodoStats?.unidades || 0)
    : (sales.unidadesTotais || 0);
  const quantidadeVendasTotal = range
    ? (periodoStats?.quantidadeVendas || 0)
    : (sales.quantidadeVendasTotal || 0);
  const variacaoReceita = stats?.variacaoReceita ?? sales.variacaoReceita ?? 0;
  const variacaoUnidades = stats?.variacaoUnidades ?? sales.variacaoUnidades ?? 0;
  const ticketMedio = quantidadeVendasTotal > 0 ? receitaTotal / quantidadeVendasTotal : 0;
  const semDados = quantidadeVendasTotal === 0;

  const trendSubtitle =
    trendGranularity === 'day' ? 'Diário' :
    trendGranularity === 'week' ? 'Semanal' :
    range ? 'Mensal (período)' : 'Últimos 6 meses';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs text-text-muted">Operações › Vendas</div>
          <h1 className="text-xl font-semibold mt-1">Relatório de Vendas</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Visão completa da performance comercial e operação financeira.
          </p>
        </div>
        <button
          onClick={() => fetchData(false)}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-text-primary bg-surface border border-border rounded-md px-3 py-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      <DateRangePicker
        value={range}
        onChange={setRange}
        onClear={() => setRange(null)}
      />

      <SalesMetricsCards
        range={range}
        receitaTotal={receitaTotal}
        unidadesTotais={unidadesTotais}
        quantidadeVendasTotal={quantidadeVendasTotal}
        variacaoReceita={variacaoReceita}
        variacaoUnidades={variacaoUnidades}
        ticketMedio={ticketMedio}
        semDados={semDados}
        trend={trend}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SalesTrendChart
          trend={trend}
          trendSubtitle={trendSubtitle}
        />
        <SalesPaymentBreakdown
          paymentBreakdown={paymentBreakdown}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SalesRecentList
          vendas={vendas}
        />
        <SalesVendorRanking
          topVendedores={topVendedores}
        />
      </div>
    </div>
  );
}
