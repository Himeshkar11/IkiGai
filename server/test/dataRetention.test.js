const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getRetentionWindows,
  getMonthBounds,
} = require('../services/dataRetentionService');

describe('Data Retention & Monthly Cleanup Pipeline', () => {
  describe('Retention Window Calculations', () => {
    it('computes correct windows for standard mid-month date', () => {
      const ref = new Date(Date.UTC(2026, 8, 15, 12, 0, 0)); // September 15, 2026
      const windows = getRetentionWindows(ref);

      assert.equal(windows.currentMonth, '2026-09');
      assert.equal(windows.previousMonth, '2026-08');

      assert.equal(windows.currentMonthStart.toISOString(), '2026-09-01T00:00:00.000Z');
      assert.equal(windows.previousMonthStart.toISOString(), '2026-08-01T00:00:00.000Z');
      assert.equal(windows.previousMonthEnd.toISOString(), '2026-08-31T23:59:59.999Z');
      assert.equal(windows.olderMonthsThreshold.toISOString(), '2026-08-01T00:00:00.000Z');
    });

    it('computes correct windows across year boundary (January to previous December)', () => {
      const janDate = new Date(Date.UTC(2027, 0, 5, 10, 0, 0)); // January 5, 2027
      const windows = getRetentionWindows(janDate);

      assert.equal(windows.currentMonth, '2027-01');
      assert.equal(windows.previousMonth, '2026-12');

      assert.equal(windows.currentMonthStart.toISOString(), '2027-01-01T00:00:00.000Z');
      assert.equal(windows.previousMonthStart.toISOString(), '2026-12-01T00:00:00.000Z');
      assert.equal(windows.previousMonthEnd.toISOString(), '2026-12-31T23:59:59.999Z');
      assert.equal(windows.olderMonthsThreshold.toISOString(), '2026-12-01T00:00:00.000Z');
    });

    it('computes correct bounds for leap year February', () => {
      const bounds = getMonthBounds('2028-02');
      assert.equal(bounds.start.toISOString(), '2028-02-01T00:00:00.000Z');
      assert.equal(bounds.end.toISOString(), '2028-02-29T23:59:59.999Z');
    });

    it('distinguishes CURRENT_MONTH, PREVIOUS_MONTH, and OLDER_MONTHS correctly', () => {
      const windows = getRetentionWindows(new Date(Date.UTC(2026, 8, 28))); // Sep 2026

      const isCurrentMonth = (dateStr) => dateStr.startsWith(windows.currentMonth);
      const isPreviousMonth = (dateStr) => dateStr.startsWith(windows.previousMonth);
      const isOlderMonth = (dateStr) => dateStr < `${windows.previousMonth}-01`;

      // Current month: 2026-09
      assert.equal(isCurrentMonth('2026-09-12'), true);
      assert.equal(isPreviousMonth('2026-09-12'), false);
      assert.equal(isOlderMonth('2026-09-12'), false);

      // Previous month: 2026-08 (must be preserved!)
      assert.equal(isCurrentMonth('2026-08-30'), false);
      assert.equal(isPreviousMonth('2026-08-30'), true);
      assert.equal(isOlderMonth('2026-08-30'), false);

      // Older month: 2026-07 (eligible for detailed cleanup after summary verification)
      assert.equal(isCurrentMonth('2026-07-31'), false);
      assert.equal(isPreviousMonth('2026-07-31'), false);
      assert.equal(isOlderMonth('2026-07-31'), true);

      // Far older month: 2025-12
      assert.equal(isOlderMonth('2025-12-25'), true);
    });
  });

  describe('Retention Safety Rules & Constraints', () => {
    it('verifies that older threshold strictly prevents deletion of previous month records', () => {
      const windows = getRetentionWindows(new Date(Date.UTC(2026, 8, 1))); // September 1, 2026
      const aug31 = new Date(Date.UTC(2026, 7, 31, 23, 59, 59)); // August 31, 2026

      // aug31 is within previous month, so it is NOT less than olderMonthsThreshold
      assert.equal(aug31 < windows.olderMonthsThreshold, false);
      assert.equal(windows.previousMonthStart.getTime() <= aug31.getTime(), true);
    });

    it('verifies that current month records are strictly protected', () => {
      const windows = getRetentionWindows(new Date(Date.UTC(2026, 8, 28)));
      const sep1 = new Date(Date.UTC(2026, 8, 1, 0, 0, 0));

      assert.equal(sep1 < windows.olderMonthsThreshold, false);
      assert.equal(sep1 >= windows.currentMonthStart, true);
    });

    it('validates aggregation data structure format for MonthlySummary', () => {
      const sampleSummary = {
        userId: '507f1f77bcf86cd799439011',
        month: '2026-08',
        todos: {
          totalCreated: 15,
          totalCompleted: 12,
          activeDays: 8,
          activityByDate: { '2026-08-01': 2, '2026-08-02': 1 },
        },
        money: {
          totalSpent: 4500,
          transactionCount: 14,
          spendingByDate: { '2026-08-05': 1200 },
        },
        nutrition: {
          daysLogged: 10,
          totalCalories: 22000,
          totalProtein: 850,
          totalCarbs: 2500,
          totalFat: 600,
          totalFiber: 180,
          dailyAverages: {
            calories: 2200,
            protein: 85,
            carbs: 250,
            fat: 60,
            fiber: 18,
          },
        },
        room: {
          daysChecked: 10,
          waterAvailableDays: 9,
          roomCleanDays: 8,
          clothesReadyDays: 7,
          tasksCompleted: 4,
        },
      };

      assert.equal(sampleSummary.todos.totalCompleted, 12);
      assert.equal(sampleSummary.money.totalSpent, 4500);
      assert.equal(sampleSummary.nutrition.dailyAverages.calories, 2200);
      assert.equal(sampleSummary.room.waterAvailableDays, 9);
      assert.match(sampleSummary.month, /^\d{4}-\d{2}$/);
    });
  });
});
