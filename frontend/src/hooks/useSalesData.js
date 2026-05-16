import { useReducer, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { vendasService } from '../services/salesService';
import { dashboardService } from '../services/dashboardService';

const initialState = {
  summary: null,
  stats: null,
  lucroEstimado: null,
  trend: [],
  trendGranularity: 'month',
  vendas: [],
  topVendedores: [],
  paymentBreakdown: [],
  loading: true,
  refreshing: false,
};

const salesReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: !action.silent, refreshing: action.silent };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        summary: action.summary,
        stats: action.stats,
        lucroEstimado: action.lucroEstimado ?? null,
        trend: action.trend || [],
        trendGranularity: action.trendGranularity || 'month',
        vendas: action.vendas || [],
        topVendedores: action.topVendedores || [],
        paymentBreakdown: action.paymentBreakdown || [],
        loading: false,
        refreshing: false,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, refreshing: false };
    case 'SET_RANGE':
      return { ...state, range: action.range };
    default:
      return state;
  }
};

export function useSalesData() {
  const [state, dispatch] = useReducer(salesReducer, { ...initialState, range: null });

  const fetchData = useCallback(async (silent = false) => {
    dispatch({ type: 'FETCH_START', silent });
    try {
      const dateParams = state.range ? { from: state.range.from, to: state.range.to } : {};
      const trendParams = state.range ? { from: state.range.from, to: state.range.to } : { meses: 6 };
      const listParams = { limit: 10, page: 1, ...(state.range && { from: state.range.from, to: state.range.to }) };

      const [summaryRes, statsRes, trendRes, vendasRes, topRes, paymentRes] = await Promise.all([
        dashboardService.getSummary(),
        vendasService.getStats(dateParams),
        vendasService.getTrend(trendParams),
        vendasService.list(listParams),
        vendasService.getTopVendedores(),
        vendasService.getPaymentBreakdown(dateParams),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        summary: summaryRes.data,
        stats: statsRes.data,
        lucroEstimado: statsRes.data.lucroEstimado ?? null,
        trend: trendRes.data.trend,
        trendGranularity: trendRes.data.granularity,
        vendas: vendasRes.data.vendas,
        topVendedores: topRes.data.ranking,
        paymentBreakdown: paymentRes.data.breakdown,
      });
    } catch (err) {
      console.error('[Sales] fetchData error:', err);
      toast.error('Falha ao carregar relatório.');
      dispatch({ type: 'FETCH_ERROR' });
    }
  }, [state.range]);

  useEffect(() => {
    fetchData(true);

    const onFocus = () => fetchData(true);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchData]);

  return {
    summary: state.summary,
    stats: state.stats,
    lucroEstimado: state.lucroEstimado,
    trend: state.trend,
    trendGranularity: state.trendGranularity,
    vendas: state.vendas,
    topVendedores: state.topVendedores,
    paymentBreakdown: state.paymentBreakdown,
    loading: state.loading,
    refreshing: state.refreshing,
    range: state.range,
    setRange: (newRange) => dispatch({ type: 'SET_RANGE', range: newRange }),
    fetchData,
  };
}
