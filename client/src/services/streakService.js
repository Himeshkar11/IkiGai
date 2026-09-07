import api from './api';

export const getStreak = async () => {
  const res = await api.get('/streak');
  return res.data;
};

export default { getStreak };