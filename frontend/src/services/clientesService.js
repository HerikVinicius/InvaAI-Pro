import api from './api';

export const clientesService = {
  list: (params) => api.get('/clientes', { params }),
  create: (payload) => api.post('/clientes', payload),
  update: (id, payload) => api.put(`/clientes/${id}`, payload),
  pagamento: (id, payload) => api.post(`/clientes/${id}/pagamento`, payload),
};
