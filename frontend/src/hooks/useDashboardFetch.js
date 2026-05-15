import useSWR from 'swr';
import api from '../services/api';

const fetcher = (url) => api.get(url).then(res => res.data);

export const useDashboardSummary = () => {
  return useSWR('/dashboard/summary', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    focusThrottleInterval: 300000,
  });
};

export const useSalesTrend = (months = 6) => {
  return useSWR(`/vendas/trend?months=${months}`, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
    focusThrottleInterval: 300000,
  });
};
