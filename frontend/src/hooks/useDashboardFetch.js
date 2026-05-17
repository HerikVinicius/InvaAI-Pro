import useSWR from 'swr';
import api from '../services/api';

const fetcher = (url) => api.get(url).then(res => res.data);

const toISO = (d) => d.toISOString().slice(0, 10);

// Retorna { from, to } como strings ISO para cada preset.
export function buildDateRange(preset, custom = null) {
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (preset === 'hoje') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { from: toISO(start), to: toISO(todayEnd) };
  }
  if (preset === '7dias') {
    const start = new Date(todayEnd);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { from: toISO(start), to: toISO(todayEnd) };
  }
  if (preset === 'personalizado' && custom?.from && custom?.to) {
    return { from: custom.from, to: custom.to };
  }
  // padrão: mês atual
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toISO(start), to: toISO(todayEnd) };
}

export const useDashboardSummary = (range) => {
  const params = range ? `?from=${range.from}T00:00:00.000Z&to=${range.to}T23:59:59.999Z` : '';
  return useSWR(`/dashboard/summary${params}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    focusThrottleInterval: 120000,
  });
};

export const useSalesTrend = (range) => {
  const params = range
    ? `?from=${range.from}T00:00:00.000Z&to=${range.to}T23:59:59.999Z`
    : '?meses=6';
  return useSWR(`/vendas/trend${params}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    focusThrottleInterval: 120000,
  });
};
