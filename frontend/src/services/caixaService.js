import api from './api';

export const caixaService = {
  atual: () => api.get('/caixa/atual'),
  list: (params) => api.get('/caixa', { params }),
  abrir: (payload) => api.post('/caixa/abrir', payload),
  fechar: (id, payload) => api.post(`/caixa/${id}/fechar`, payload),
  sangria: (id, payload) => api.post(`/caixa/${id}/sangria`, payload),
  resumo: (id) => api.get(`/caixa/${id}/resumo`),
  transactions: (id, params) => api.get(`/caixa/${id}/transactions`, { params }),
};
