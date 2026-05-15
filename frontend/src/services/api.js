import axios from 'axios';
import { setupApiInterceptors } from './apiInterceptors';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout
});

// Inject auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('invaai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Setup comprehensive error handling interceptors
setupApiInterceptors(api);

export default api;
