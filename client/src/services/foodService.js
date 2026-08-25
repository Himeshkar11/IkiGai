import api from './api';

export const searchFoods = async (q) => {
  const res = await api.get('/foods', {
    params: { search: q },
  });

  return res.data.foods;
};

export const createFood = async (data) => {
  const res = await api.post('/foods', data);
  return res.data.food;
};

export const updateFood = async (id, data) => {
  const res = await api.put(`/foods/${id}`, data);
  return res.data.food;
};

export const deleteFood = async (id) => {
  const res = await api.delete(`/foods/${id}`);
  return res.data;
};

export const getFoodLogByDate = async (date) => {
  const res = await api.get(`/food-logs/date/${date}`);
  return res.data;
};

export const addItemToMeal = async (date, meal, payload) => {
  const res = await api.post(
    `/food-logs/${date}/meals/${meal}/items`,
    payload
  );

  return res.data.foodLog;
};

export const updateMealItem = async (logId, meal, itemId, payload) => {
  const res = await api.put(
    `/food-logs/${logId}/meals/${meal}/items/${itemId}`,
    payload
  );

  return res.data.foodLog;
};

export const deleteMealItem = async (logId, meal, itemId) => {
  const res = await api.delete(
    `/food-logs/${logId}/meals/${meal}/items/${itemId}`
  );

  return res.data.foodLog;
};

// AI food analysis
export const analyzeFood = async (text) => {
  const res = await api.post('/ai/food-parser', {
    text,
  });

  return res.data;
};

export default {
  searchFoods,
  createFood,
  updateFood,
  deleteFood,
  getFoodLogByDate,
  addItemToMeal,
  updateMealItem,
  deleteMealItem,
  analyzeFood,
};