import api from './api';

export const getRoomStatusByDate = async (date) => {
  const res = await api.get(`/room/status/${date}`);
  return res.data;
};

export default {
  getRoomStatusByDate,
};
