const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    servingSize: {
      type: Number,
      required: [true, 'Serving size is required'],
    },
    servingUnit: {
      type: String,
      required: [true, 'Serving unit is required'],
      enum: ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'slice'],
    },
    calories: {
      type: Number,
      required: [true, 'Calories is required'],
      min: 0,
    },
    protein: {
      type: Number,
      required: true,
      min: 0,
    },
    carbs: {
      type: Number,
      required: true,
      min: 0,
    },
    fat: {
      type: Number,
      required: true,
      min: 0,
    },
    fiber: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

foodSchema.index({ userId: 1, name: 1 });
foodSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Food', foodSchema);
