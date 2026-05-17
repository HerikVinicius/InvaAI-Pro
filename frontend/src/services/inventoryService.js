import api from './api';

export const inventoryService = {
  list: (params = {}) => api.get('/inventory', { params }),
  warehouses: () => api.get('/inventory/warehouses'),
  create: (payload) => api.post('/inventory', payload),
  update: (id, payload) => api.put(`/inventory/${id}`, payload),
  remove: (id, payload = {}) => api.delete(`/inventory/${id}`, { data: payload }),
  logs: (params = {}) => api.get('/inventory/logs', { params }),
  productLogs: (id) => api.get(`/inventory/${id}/logs`),
};
