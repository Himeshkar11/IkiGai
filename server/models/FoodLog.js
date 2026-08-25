const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
  },
  calories: {
    type: Number,
    required: true,
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
  },
});

const mealSchema = new mongoose.Schema({
  breakfast: [foodItemSchema],
  morningSnack: [foodItemSchema],
  lunch: [foodItemSchema],
  eveningSnack: [foodItemSchema],
  dinner: [foodItemSchema],
});

const totalsSchema = new mongoose.Schema({
  calories: {
    type: Number,
    default: 0,
    min: 0,
  },
  protein: {
    type: Number,
    default: 0,
    min: 0,
  },
  carbs: {
    type: Number,
    default: 0,
    min: 0,
  },
  fat: {
    type: Number,
    default: 0,
    min: 0,
  },
  fiber: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    meals: mealSchema,
    totals: totalsSchema,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

foodLogSchema.index({ userId: 1, date: -1 });
foodLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
