import axios from 'axios';

const baseURL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

import { getLogicalToday } from '../utils/activity.js';

// Add auth token and client date interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    try {
      const clientToday = getLogicalToday();
      if (clientToday) {
        config.headers['X-Client-Today'] = clientToday;
      }
    } catch {
      // ignore
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('authToken');
      // Reload page to trigger auth check
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export { api };
export default api;
