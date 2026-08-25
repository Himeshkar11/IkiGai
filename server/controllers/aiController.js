const { parseFoodText } = require('../services/aiFoodParser');

// POST /api/ai/food-parser
const parseFood = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Food description is required',
      });
    }

    const items = await parseFoodText(text);

    res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  parseFood,
};