import api from './api';

export const getMonthlyActivity = async (month) => {
  const res = await api.get('/activity', { params: { month } });
  return res.data;
};

export default { getMonthlyActivity };