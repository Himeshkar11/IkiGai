const Food = require('../models/Food');

// GET /api/foods?search=
const getFoods = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { search } = req.query;

    const filter = { userId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const foods = await Food.find(filter).sort({ name: 1 }).limit(200);

    res.status(200).json({ success: true, foods });
  } catch (error) {
    next(error);
  }
};

// POST /api/foods
const createFood = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      servingSize,
      servingUnit,
      calories,
      protein,
      carbs,
      fat,
      fiber,
    } = req.body;

    const food = new Food({
      userId,
      name,
      servingSize,
      servingUnit,
      calories,
      protein,
      carbs,
      fat,
      fiber,
    });

    await food.save();

    res.status(201).json({ success: true, food });
  } catch (error) {
    next(error);
  }
};

// GET /api/foods/:id
const getFoodById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const food = await Food.findOne({ _id: id, userId });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    res.status(200).json({ success: true, food });
  } catch (error) {
    next(error);
  }
};

// PUT /api/foods/:id
const updateFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const food = await Food.findOneAndUpdate({ _id: id, userId }, req.body, {
      new: true,
      runValidators: true,
    });

    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    res.status(200).json({ success: true, food });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/foods/:id
const deleteFood = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const food = await Food.findOneAndDelete({ _id: id, userId });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }

    res.status(200).json({ success: true, message: 'Food deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFoods,
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
};
