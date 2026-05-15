import api from './api';

export const salesService = {
  getMonthlySales: (year) => api.get(`/sales?year=${year || new Date().getFullYear()}`),
  addMonthlySales: (payload) => api.post('/sales', payload),
  updateMonthlySales: (id, payload) => api.put(`/sales/${id}`, payload),
};

// getTrend e getStats aceitam:
//   - getStats({ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }) — range custom
//   - getTrend({ from, to }) — range custom (granularidade dia/semana/mês auto)
//   - getTrend({ meses: 6 }) — fallback antigo para o dashboard
//   - getTrend(6) — overload numérico legado, mantido para os hooks do dashboard
export const vendasService = {
  list: (params = {}) => api.get('/vendas', { params }),
  create: (payload) => api.post('/vendas', payload),
  cancel: (id, reason) => api.post(`/vendas/${id}/cancel`, { reason }),
  getStats: (params = {}) => api.get('/vendas/stats', { params }),
  getTrend: (mesesOrParams = 6) => {
    const params = typeof mesesOrParams === 'number' ? { meses: mesesOrParams } : mesesOrParams;
    return api.get('/vendas/trend', { params });
  },
  getTopVendedores: () => api.get('/vendas/top-vendedores'),
  getProdutosPorVendedor: (vendorId) => api.get(`/vendas/produtos/${vendorId}`),
  getPaymentBreakdown: (params = {}) => api.get('/vendas/payment-breakdown', { params }),
};
