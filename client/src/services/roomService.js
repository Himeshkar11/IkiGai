import api from './api';

export const getRoomStatusByDate = async (date) => {
  const res = await api.get(`/room/status/${date}`);
  return res.data;
};

export const updateRoomStatus = async (date, statusData) => {
  const res = await api.put(`/room/status/${date}`, statusData);
  return res.data;
};

export const getRoomTasksByDate = async (date) => {
  const res = await api.get(`/room/tasks/${date}`);
  return res.data;
};

export const createRoomTask = async (taskData) => {
  const res = await api.post('/room/tasks', taskData);
  return res.data;
};

export const updateRoomTask = async (id, taskData) => {
  const res = await api.put(`/room/tasks/${id}`, taskData);
  return res.data;
};

export const deleteRoomTask = async (id) => {
  const res = await api.delete(`/room/tasks/${id}`);
  return res.data;
};

export const completeRoomTask = async (id, date) => {
  const res = await api.put(`/room/tasks/${id}/complete`, { date });
  return res.data;
};

export default {
  getRoomStatusByDate,
  updateRoomStatus,
  getRoomTasksByDate,
  createRoomTask,
  updateRoomTask,
  deleteRoomTask,
  completeRoomTask,
};
