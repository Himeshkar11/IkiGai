import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});

export const getHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
