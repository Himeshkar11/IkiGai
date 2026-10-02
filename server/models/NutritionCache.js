const mongoose = require('mongoose');

const nutritionCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    normalizedQuery: {
      type: String,
      required: true,
      index: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    promptVersion: {
      type: String,
      default: 'v1.0',
    },
    model: {
      type: String,
      default: 'openai/gpt-oss-20b',
    },
    hitCount: {
      type: Number,
      default: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 7776000, // 90 days in seconds (90 * 24 * 60 * 60)
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: 'nutritioncaches',
  }
);

module.exports = mongoose.model('NutritionCache', nutritionCacheSchema);
