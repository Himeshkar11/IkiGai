import api from './api';

export const getTransactionsByDate = async (date) => {
  const res = await api.get('/money', { params: { date } });
  return res.data;
};

export const createTransaction = async (payload) => {
  const res = await api.post('/money', payload);
  return res.data.transaction;
};

export const updateTransaction = async (id, payload) => {
  const res = await api.put(`/money/${id}`, payload);
  return res.data.transaction;
};

export const deleteTransaction = async (id) => {
  const res = await api.delete(`/money/${id}`);
  return res.data;
};

export default {
  getTransactionsByDate,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
