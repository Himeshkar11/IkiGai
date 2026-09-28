const mongoose = require('mongoose');

const monthlySummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'UserId is required'],
      index: true,
    },
    month: {
      type: String, // Format: YYYY-MM
      required: [true, 'Month key (YYYY-MM) is required'],
      match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
      index: true,
    },
    todos: {
      totalCreated: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      activeDays: { type: Number, default: 0 },
      activityByDate: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    money: {
      totalSpent: { type: Number, default: 0 },
      transactionCount: { type: Number, default: 0 },
      spendingByDate: {
        type: Map,
        of: Number,
        default: {},
      },
    },
    nutrition: {
      daysLogged: { type: Number, default: 0 },
      totalCalories: { type: Number, default: 0 },
      totalProtein: { type: Number, default: 0 },
      totalCarbs: { type: Number, default: 0 },
      totalFat: { type: Number, default: 0 },
      totalFiber: { type: Number, default: 0 },
      dailyAverages: {
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
      },
    },
    room: {
      daysChecked: { type: Number, default: 0 },
      waterAvailableDays: { type: Number, default: 0 },
      roomCleanDays: { type: Number, default: 0 },
      clothesReadyDays: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 },
    },
    archivedAt: {
      type: Date,
      default: Date.now,
    },
    retentionVersion: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique constraint so duplicate monthly summaries are impossible
monthlySummarySchema.index({ userId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
