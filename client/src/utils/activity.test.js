import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getActivityLevel,
  getLogicalDate,
  getActivityDate,
  aggregateTasksByDate,
  getMonthKey,
  getLogicalMonthKey,
  generateMonthGrid,
} from './activity.js';

describe('Activity Level Calculation', () => {
  it('returns level 0 for 0 or negative tasks', () => {
    assert.equal(getActivityLevel(0), 0);
    assert.equal(getActivityLevel(-1), 0);
    assert.equal(getActivityLevel(null), 0);
    assert.equal(getActivityLevel(undefined), 0);
  });

  it('returns level 1 for 1 or 2 completed tasks (One task must count)', () => {
    assert.equal(getActivityLevel(1), 1);
    assert.equal(getActivityLevel(2), 1);
  });

  it('returns level 2 for 3 or 4 completed tasks', () => {
    assert.equal(getActivityLevel(3), 2);
    assert.equal(getActivityLevel(4), 2);
  });

  it('returns level 3 for 5, 6, or 7 completed tasks', () => {
    assert.equal(getActivityLevel(5), 3);
    assert.equal(getActivityLevel(6), 3);
    assert.equal(getActivityLevel(7), 3);
  });

  it('returns level 4 for 8 or more completed tasks', () => {
    assert.equal(getActivityLevel(8), 4);
    assert.equal(getActivityLevel(9), 4);
    assert.equal(getActivityLevel(15), 4);
  });
});

describe('Date Normalization & Logical Date Handling', () => {
  it('preserves YYYY-MM-DD date strings without shifting to previous day', () => {
    assert.equal(getLogicalDate('2026-09-07'), '2026-09-07');
    assert.equal(getLogicalDate('2026-08-01'), '2026-08-01');
    assert.equal(getLogicalDate('2026-12-31'), '2026-12-31');
  });

  it('returns null safely for null value', () => {
    assert.equal(getLogicalDate(null), null);
  });

  it('returns a non-null string for undefined (current date)', () => {
    const today = getLogicalDate();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects the 4:00 AM logical productivity day boundary', () => {
    // 03:59 AM on September 5 belongs to September 4
    const beforeFourAM = new Date(2026, 8, 5, 3, 59, 0);
    assert.equal(getLogicalDate(beforeFourAM), '2026-09-04');

    // 04:00 AM on September 5 belongs to September 5
    const atFourAM = new Date(2026, 8, 5, 4, 0, 0);
    assert.equal(getLogicalDate(atFourAM), '2026-09-05');
  });

  it('respects midnight boundaries', () => {
    // 23:59 on September 5 belongs to September 5
    const lateNight = new Date(2026, 8, 5, 23, 59, 0);
    assert.equal(getLogicalDate(lateNight), '2026-09-05');

    // 00:01 on September 6 is before 4 AM, so it belongs to September 5
    const earlyMidnight = new Date(2026, 8, 6, 0, 1, 0);
    assert.equal(getLogicalDate(earlyMidnight), '2026-09-05');
  });

  it('handles month boundaries correctly', () => {
    const aug31Midday = new Date(2026, 7, 31, 14, 0, 0);
    assert.equal(getLogicalDate(aug31Midday), '2026-08-31');

    const sep1Midday = new Date(2026, 8, 1, 14, 0, 0);
    assert.equal(getLogicalDate(sep1Midday), '2026-09-01');
  });

  it('handles year boundaries correctly', () => {
    const dec31 = new Date(2025, 11, 31, 12, 0, 0);
    assert.equal(getLogicalDate(dec31), '2025-12-31');

    const jan1 = new Date(2026, 0, 1, 12, 0, 0);
    assert.equal(getLogicalDate(jan1), '2026-01-01');
  });

  it('handles leap years correctly (2028-02-29)', () => {
    const leapDay = new Date(2028, 1, 29, 12, 0, 0);
    assert.equal(getLogicalDate(leapDay), '2028-02-29');

    const nextDay = new Date(2028, 2, 1, 12, 0, 0);
    assert.equal(getLogicalDate(nextDay), '2028-03-01');
  });
});

describe('Task Activity Aggregation (aggregateTasksByDate)', () => {
  it('returns empty object when no completed tasks exist', () => {
    const tasks = [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: false },
    ];
    const result = aggregateTasksByDate(tasks);
    assert.deepEqual(result, {});
  });

  it('aggregates single completed task', () => {
    const tasks = [
      { id: '1', completed: true, completedAt: '2026-09-03' },
    ];
    const result = aggregateTasksByDate(tasks, { maxDate: '2026-09-10' });
    assert.equal(result['2026-09-03'], 1);
  });

  it('aggregates multiple tasks on the same day', () => {
    const tasks = [
      { id: '1', completed: true, completedAt: '2026-09-07' },
      { id: '2', completed: true, completedAt: '2026-09-07' },
      { id: '3', completed: true, completedAt: '2026-09-07' },
      { id: '4', completed: true, completedAt: '2026-09-07' },
    ];
    const result = aggregateTasksByDate(tasks, { maxDate: '2026-09-10' });
    assert.equal(result['2026-09-07'], 4);
  });

  it('aggregates tasks across different days separately', () => {
    const tasks = [
      { id: '1', completed: true, completedAt: '2026-09-01' },
      { id: '2', completed: true, completedAt: '2026-09-01' },
      { id: '3', completed: true, completedAt: '2026-09-02' },
      { id: '4', completed: true, completedAt: '2026-09-02' },
      { id: '5', completed: true, completedAt: '2026-09-02' },
      { id: '6', completed: true, completedAt: '2026-09-02' },
      { id: '7', completed: true, completedAt: '2026-09-02' },
      { id: '8', completed: true, completedAt: '2026-09-03' },
    ];
    const result = aggregateTasksByDate(tasks, { maxDate: '2026-09-10' });
    assert.deepEqual(result, {
      '2026-09-01': 2,
      '2026-09-02': 5,
      '2026-09-03': 1,
    });
  });

  it('uses completion date, NOT creation date (authoritative completion)', () => {
    const task = {
      id: '1',
      createdAt: '2026-09-01',
      completedAt: '2026-09-05',
      completed: true,
    };
    const result = aggregateTasksByDate([task], { maxDate: '2026-09-10' });
    assert.equal(result['2026-09-01'], undefined);
    assert.equal(result['2026-09-05'], 1);
  });

  it('ignores future tasks beyond maxDate', () => {
    const tasks = [
      { id: '1', completed: true, completedAt: '2026-09-07' },
      { id: '2', completed: true, completedAt: '2026-09-08' }, // future
    ];
    const result = aggregateTasksByDate(tasks, { maxDate: '2026-09-07' });
    assert.equal(result['2026-09-07'], 1);
    assert.equal(result['2026-09-08'], undefined);
  });

  it('supports the August 2026 historical scenario', () => {
    const tasks = [
      // Aug 1 -> 2 tasks
      { completed: true, completedAt: '2026-08-01' },
      { completed: true, completedAt: '2026-08-01' },
      // Aug 5 -> 7 tasks
      ...Array.from({ length: 7 }, () => ({ completed: true, completedAt: '2026-08-05' })),
      // Aug 12 -> 1 task
      { completed: true, completedAt: '2026-08-12' },
      // Aug 20 -> 5 tasks
      ...Array.from({ length: 5 }, () => ({ completed: true, completedAt: '2026-08-20' })),
      // Aug 31 -> 3 tasks
      ...Array.from({ length: 3 }, () => ({ completed: true, completedAt: '2026-08-31' })),
    ];

    const result = aggregateTasksByDate(tasks, { maxDate: '2026-09-10' });
    assert.equal(result['2026-08-01'], 2);
    assert.equal(result['2026-08-05'], 7);
    assert.equal(result['2026-08-12'], 1);
    assert.equal(result['2026-08-20'], 5);
    assert.equal(result['2026-08-31'], 3);
    assert.equal(result['2026-08-02'], undefined); // 0 tasks
  });
});

describe('Month Grid Generation', () => {
  it('generates a grid for September 2026 with correct days and padding', () => {
    const grid = generateMonthGrid('2026-09');
    // Multiples of 7
    assert.equal(grid.length % 7, 0);

    // Filter non-null days: September has 30 days
    const days = grid.filter((d) => d !== null);
    assert.equal(days.length, 30);

    // Sep 1, 2026 is Tuesday -> 1 leading null for Monday
    assert.equal(grid[0], null);
    assert.equal(grid[1].getDate(), 1);
  });

  it('handles leap February 2028 correctly', () => {
    const grid = generateMonthGrid('2028-02');
    const days = grid.filter((d) => d !== null);
    assert.equal(days.length, 29);
  });
});
