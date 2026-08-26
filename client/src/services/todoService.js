import api from './api';

export const getTodosByDate = async (date) => {
  const res = await api.get('/todos', { params: { date } });
  return res.data;
};

export const createTodo = async (payload) => {
  const res = await api.post('/todos', payload);
  return res.data.todo;
};

export const updateTodo = async (id, payload) => {
  const res = await api.put(`/todos/${id}`, payload);
  return res.data.todo;
};

export const deleteTodo = async (id) => {
  const res = await api.delete(`/todos/${id}`);
  return res.data;
};

export default {
  getTodosByDate,
  createTodo,
  updateTodo,
  deleteTodo,
};
