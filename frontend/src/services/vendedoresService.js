import api from './api';

export const vendedoresService = {
  list: (params = {}) => api.get('/vendedores', { params }),
  create: (payload) => api.post('/vendedores', payload),
  // id = Salesperson._id (tenant DB)
  update: (id, payload) => api.put(`/vendedores/${id}`, payload),
  // userId = User._id (admin DB) — linked via salesperson.userId
  toggleActive: (userId, isActive) => api.put(`/users/${userId}/active`, { isActive }),
};
