import api from './api';

export const notificationService = {
  list: (params) => api.get('/notifications', { params }),
  getUnread: () => api.get('/notifications?unreadOnly=true'),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};
