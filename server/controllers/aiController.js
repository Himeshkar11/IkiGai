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

    const result = await parseFoodText(text);
    const items = Array.isArray(result) ? result : result.items;
    const source = result.source || 'ai';

    res.status(200).json({
      success: true,
      items,
      source,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  parseFood,
};