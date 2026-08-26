import { useEffect, useState } from 'react';
import * as todoService from '../services/todoService';
import * as foodService from '../services/foodService';
import * as roomService from '../services/roomService';
import * as moneyService from '../services/moneyService';

const emptyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

export const foodTotalsFromLog = (foodLog) => {
  if (foodLog?.totals) {
    return {
      calories: Number(foodLog.totals.calories) || 0,
      protein: Number(foodLog.totals.protein) || 0,
      carbs: Number(foodLog.totals.carbs) || 0,
      fat: Number(foodLog.totals.fat) || 0,
      fiber: Number(foodLog.totals.fiber) || 0,
    };
  }

  const totals = { ...emptyTotals };
  if (!foodLog?.meals) return totals;

  Object.values(foodLog.meals).forEach((items) => {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
      totals.fiber += Number(item.fiber) || 0;
    });
  });
  return totals;
};

export const mealItemCount = (foodLog) => {
  if (!foodLog?.meals) return 0;
  return Object.values(foodLog.meals).reduce((sum, items) => {
    return sum + (Array.isArray(items) ? items.length : 0);
  }, 0);
};

const useHomeDashboard = (date) => {
  const [todos, setTodos] = useState({ loading: true, error: null, items: [] });
  const [food, setFood] = useState({ loading: true, error: null, log: null });
  const [room, setRoom] = useState({ loading: true, error: null, status: null });
  const [money, setMoney] = useState({
    loading: true,
    error: null,
    total: 0,
    transactions: [],
  });

  const loadTodos = async (day, cancelled) => {
    setTodos((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await todoService.getTodosByDate(day);
      if (!cancelled?.()) setTodos({ loading: false, error: null, items: res.todos || [] });
    } catch (e) {
      if (!cancelled?.()) {
        setTodos({
          loading: false,
          error: e.response?.data?.message || 'Failed to load tasks',
          items: [],
        });
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    loadTodos(date, isCancelled);

    setFood({ loading: true, error: null, log: null });
    foodService
      .getFoodLogByDate(date)
      .then((res) => {
        if (!cancelled) setFood({ loading: false, error: null, log: res.foodLog || null });
      })
      .catch((e) => {
        if (!cancelled) {
          setFood({
            loading: false,
            error: e.response?.data?.message || 'Failed to load food',
            log: null,
          });
        }
      });

    setRoom({ loading: true, error: null, status: null });
    roomService
      .getRoomStatusByDate(date)
      .then((status) => {
        if (!cancelled) setRoom({ loading: false, error: null, status });
      })
      .catch((e) => {
        if (!cancelled) {
          setRoom({
            loading: false,
            error: e.response?.data?.message || 'Failed to load room',
            status: null,
          });
        }
      });

    setMoney((prev) => ({ ...prev, loading: true, error: null }));
    moneyService
      .getTransactionsByDate(date)
      .then((res) => {
        if (!cancelled) {
          setMoney({
            loading: false,
            error: null,
            total: res.total ?? 0,
            transactions: res.transactions || [],
          });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setMoney({
            loading: false,
            error: e.response?.data?.message || 'Failed to load spending',
            total: 0,
            transactions: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const refreshTodos = () => loadTodos(date, () => false);

  return { todos, food, room, money, refreshTodos };
};

export default useHomeDashboard;
