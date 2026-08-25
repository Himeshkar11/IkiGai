const FoodLog = require('../models/FoodLog');
const Food = require('../models/Food');
const mongoose = require('mongoose');

const mealNames = ['breakfast', 'morningSnack', 'lunch', 'eveningSnack', 'dinner'];

const zeroTotals = () => ({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

const recalcTotals = (meals) => {
  const totals = zeroTotals();
  mealNames.forEach((m) => {
    const arr = meals?.[m] || [];
    arr.forEach((it) => {
      totals.calories += it.calories || 0;
      totals.protein += it.protein || 0;
      totals.carbs += it.carbs || 0;
      totals.fat += it.fat || 0;
      totals.fiber += it.fiber || 0;
    });
  });
  return totals;
};

// GET /api/food-logs
const getFoodLogs = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const logs = await FoodLog.find({ userId }).sort({ date: -1 }).limit(50);
    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

// GET /api/food-logs/date/:date
const getFoodLogByDate = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const dateParam = req.params.date; // expected YYYY-MM-DD or ISO
    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);

    let log = await FoodLog.findOne({ userId, date });
    if (!log) {
      // return empty template
      const meals = {};
      mealNames.forEach((m) => (meals[m] = []));
      log = { userId, date, meals, totals: zeroTotals() };
      return res.status(200).json({ success: true, foodLog: log, exists: false });
    }

    res.status(200).json({ success: true, foodLog: log, exists: true });
  } catch (error) {
    next(error);
  }
};

// POST /api/food-logs - create or replace
const createOrReplaceFoodLog = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { date: dateParam, meals } = req.body;
    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);

    const totals = recalcTotals(meals || {});

    const doc = await FoodLog.findOneAndUpdate(
      { userId, date },
      { userId, date, meals, totals },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ success: true, foodLog: doc });
  } catch (error) {
    next(error);
  }
};

// GET by id
const getFoodLogById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid id' });
    const log = await FoodLog.findOne({ _id: id, userId });
    if (!log) return res.status(404).json({ success: false, message: 'Food log not found' });
    res.status(200).json({ success: true, foodLog: log });
  } catch (error) {
    next(error);
  }
};

// PUT /api/food-logs/:id - full update
const updateFoodLog = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { meals } = req.body;
    const totals = recalcTotals(meals || {});
    const log = await FoodLog.findOneAndUpdate({ _id: id, userId }, { meals, totals }, { new: true, runValidators: true });
    if (!log) return res.status(404).json({ success: false, message: 'Food log not found' });
    res.status(200).json({ success: true, foodLog: log });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/food-logs/:id
const deleteFoodLog = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const log = await FoodLog.findOneAndDelete({ _id: id, userId });
    if (!log) return res.status(404).json({ success: false, message: 'Food log not found' });
    res.status(200).json({ success: true, message: 'Food log deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper to compute snapshot from Food master and quantity
const computeSnapshot = (food, quantity) => {
  // quantity is number of servings. Multiply per-serving nutrients.
  const q = Number(quantity) || 0;
  return {
    foodId: food._id,
    name: food.name,
    servingSize: food.servingSize,
    servingUnit: food.servingUnit,
    quantity: q,
    calories: (food.calories || 0) * q,
    protein: (food.protein || 0) * q,
    carbs: (food.carbs || 0) * q,
    fat: (food.fat || 0) * q,
    fiber: (food.fiber || 0) * q,
  };
};

// POST /api/food-logs/:date/meals/:meal/items
const addItemToMeal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { date } = req.params; // YYYY-MM-DD
    const { meal } = req.params;
    const { foodId, quantity } = req.body;

    if (!mealNames.includes(meal)) return res.status(400).json({ success: false, message: 'Invalid meal name' });

    const food = await Food.findOne({ _id: foodId, userId });
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });

    const snapshot = computeSnapshot(food, quantity);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const update = { $push: {} };
    update.$push[`meals.${meal}`] = snapshot;

    let log = await FoodLog.findOneAndUpdate({ userId, date: d }, update, { new: true });
    if (!log) {
      const meals = {};
      mealNames.forEach((m) => (meals[m] = []));
      meals[meal] = [snapshot];
      const totals = recalcTotals(meals);
      log = await FoodLog.create({ userId, date: d, meals, totals });
      return res.status(201).json({ success: true, foodLog: log });
    }

    // Recalculate totals
    const totals = recalcTotals(log.meals);
    log.totals = totals;
    await log.save();

    res.status(200).json({ success: true, foodLog: log });
  } catch (error) {
    next(error);
  }
};

// PUT /api/food-logs/:id/meals/:meal/items/:itemId
const updateMealItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id, meal, itemId } = req.params;
    const { quantity } = req.body;

    if (!mealNames.includes(meal)) return res.status(400).json({ success: false, message: 'Invalid meal name' });

    const log = await FoodLog.findOne({ _id: id, userId });
    if (!log) return res.status(404).json({ success: false, message: 'Food log not found' });

    const item = log.meals[meal].id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    // If item has foodId, fetch master to recalc snapshot
    if (item.foodId) {
      const food = await Food.findOne({ _id: item.foodId, userId });
      if (!food) return res.status(404).json({ success: false, message: 'Referenced food not found' });
      const snap = computeSnapshot(food, quantity);
      item.quantity = snap.quantity;
      item.calories = snap.calories;
      item.protein = snap.protein;
      item.carbs = snap.carbs;
      item.fat = snap.fat;
      item.fiber = snap.fiber;
    } else {
      // For items without foodId (custom stored), scale fields proportionally by quantity
      const q = Number(quantity) || 0;
      const perUnit = item.quantity ? 1.0 * (item.calories / item.quantity) : 0;
      item.quantity = q;
      item.calories = perUnit * q;
      // For safety, not attempting to recompute other macros if missing; keep ratios
      const ratio = item.protein ? item.protein / (item.quantity || 1) : 0;
      item.protein = ratio * q;
      const ratioC = item.carbs ? item.carbs / (item.quantity || 1) : 0;
      item.carbs = ratioC * q;
      const ratioF = item.fat ? item.fat / (item.quantity || 1) : 0;
      item.fat = ratioF * q;
      const ratioFi = item.fiber ? item.fiber / (item.quantity || 1) : 0;
      item.fiber = ratioFi * q;
    }

    await log.save();
    log.totals = recalcTotals(log.meals);
    await log.save();

    res.status(200).json({ success: true, foodLog: log });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/food-logs/:id/meals/:meal/items/:itemId
const deleteMealItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id, meal, itemId } = req.params;

    if (!mealNames.includes(meal)) return res.status(400).json({ success: false, message: 'Invalid meal name' });

    const log = await FoodLog.findOne({ _id: id, userId });
    if (!log) return res.status(404).json({ success: false, message: 'Food log not found' });

    const arr = log.meals[meal];
    const idx = arr.findIndex((it) => String(it._id) === String(itemId));
    if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
    arr.splice(idx, 1);

    log.totals = recalcTotals(log.meals);
    await log.save();

    res.status(200).json({ success: true, foodLog: log });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoodLogs,
  getFoodLogByDate,
  createOrReplaceFoodLog,
  getFoodLogById,
  updateFoodLog,
  deleteFoodLog,
  addItemToMeal,
  updateMealItem,
  deleteMealItem,
};
