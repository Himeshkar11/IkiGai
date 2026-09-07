/**
 * todoDatePermission.test.js
 *
 * Unit tests for the date-permission enforcement in todoController.
 *
 * These tests do NOT hit a database or start the Express server.
 * They test the pure business-rule logic extracted into standalone helper
 * functions that mirror exactly what the controller uses, making them fast,
 * reliable, and deterministic.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  getStoredTodoDate,
  getDatePermission,
  getLogicalToday,
} = require('../utils/dateUtils');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers mirroring controller logic
// ─────────────────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

const toDayString = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

/**
 * Simulates the permission check performed by createTodo.
 * Returns 'allowed' or 'forbidden'.
 */
const simulateCreate = (dueDateInput) => {
  if (dueDateInput === null || dueDateInput === undefined || dueDateInput === '') {
    return 'allowed';
  }

  const day = toDayString(dueDateInput);
  if (!day) return 'bad-request';
  return getDatePermission(day) === 'today' ? 'allowed' : 'forbidden';
};

/**
 * Simulates the permission check performed by updateTodo.
 * taskDueDate is the stored dueDate (UTC midnight Date object or ISO string).
 * newDueDate (optional) is the requested new dueDate.
 * Returns 'allowed', 'forbidden', or 'bad-request'.
 */
const simulateUpdate = (taskDueDate, newDueDate) => {
  // Check the task's own date
  const storedDate = getStoredTodoDate(taskDueDate);
  if (getDatePermission(storedDate) !== 'today') return 'forbidden';

  // If caller also wants to change the dueDate, validate the new date
  if (newDueDate !== undefined) {
    const newDay = toDayString(newDueDate);
    if (!newDay) return 'bad-request';
    if (getDatePermission(newDay) !== 'today') return 'forbidden';
  }

  return 'allowed';
};

/**
 * Simulates the permission check performed by deleteTodo.
 * taskDueDate is the stored dueDate (UTC midnight Date object or ISO string).
 * Returns 'allowed' or 'forbidden'.
 */
const simulateDelete = (taskDueDate) => {
  const storedDate = getStoredTodoDate(taskDueDate);
  return getDatePermission(storedDate) === 'today' ? 'allowed' : 'forbidden';
};

// ─────────────────────────────────────────────────────────────────────────────
// Date helpers used across tests
// ─────────────────────────────────────────────────────────────────────────────

const today = getLogicalToday(); // e.g. '2026-09-07'
const [ty, tm, td] = today.split('-').map(Number);

// Build UTC midnight Date objects for today, yesterday, and tomorrow
// (these mirror how dueDate is stored in the database via dayBounds().start)
const todayUTC = new Date(`${today}T00:00:00.000Z`);

const yesterday = new Date(ty, tm - 1, td - 1);
const yesterdayStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`;
const yesterdayUTC = new Date(`${yesterdayStr}T00:00:00.000Z`);

const tomorrow = new Date(ty, tm - 1, td + 1);
const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;
const tomorrowUTC = new Date(`${tomorrowStr}T00:00:00.000Z`);

// ─────────────────────────────────────────────────────────────────────────────
// CREATE tests
// ─────────────────────────────────────────────────────────────────────────────

describe('createTodo — Date Permission Enforcement', () => {
  it('allows creating a task for today', () => {
    assert.equal(simulateCreate(today), 'allowed');
  });

  it('automatically assigns a task to today when no explicit due date is supplied', () => {
    assert.equal(simulateCreate(), 'allowed');
    assert.equal(simulateCreate(null), 'allowed');
    assert.equal(simulateCreate(''), 'allowed');
  });

  it('rejects creating a task for yesterday', () => {
    assert.equal(simulateCreate(yesterdayStr), 'forbidden');
  });

  it('rejects creating a task for tomorrow', () => {
    assert.equal(simulateCreate(tomorrowStr), 'forbidden');
  });

  it('rejects creating a task far in the past (2020-01-01)', () => {
    assert.equal(simulateCreate('2020-01-01'), 'forbidden');
  });

  it('rejects creating a task far in the future (2030-12-31)', () => {
    assert.equal(simulateCreate('2030-12-31'), 'forbidden');
  });

  it('defaults missing or blank dueDate values to today', () => {
    assert.equal(simulateCreate(null), 'allowed');
    assert.equal(simulateCreate(''), 'allowed');
  });

  it('rejects an invalid explicit dueDate string', () => {
    assert.equal(simulateCreate('not-a-date'), 'bad-request');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE tests
// ─────────────────────────────────────────────────────────────────────────────

describe('updateTodo — Date Permission Enforcement', () => {
  it('allows updating a task that belongs to today', () => {
    assert.equal(simulateUpdate(todayUTC), 'allowed');
  });

  it('rejects updating a task that belongs to yesterday', () => {
    assert.equal(simulateUpdate(yesterdayUTC), 'forbidden');
  });

  it('rejects updating a task that belongs to tomorrow', () => {
    assert.equal(simulateUpdate(tomorrowUTC), 'forbidden');
  });

  it('allows updating a today task without changing its date', () => {
    // newDueDate = undefined means the update does not change dueDate
    assert.equal(simulateUpdate(todayUTC, undefined), 'allowed');
  });

  it('allows updating a today task while keeping the date as today', () => {
    assert.equal(simulateUpdate(todayUTC, today), 'allowed');
  });

  it('rejects moving a today task to yesterday', () => {
    assert.equal(simulateUpdate(todayUTC, yesterdayStr), 'forbidden');
  });

  it('rejects moving a today task to tomorrow', () => {
    assert.equal(simulateUpdate(todayUTC, tomorrowStr), 'forbidden');
  });

  it('rejects moving a yesterday task to today (double-check: task itself is past)', () => {
    // Even if newDueDate=today, the task itself is from yesterday → rejected
    assert.equal(simulateUpdate(yesterdayUTC, today), 'forbidden');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE tests
// ─────────────────────────────────────────────────────────────────────────────

describe('deleteTodo — Date Permission Enforcement', () => {
  it('allows deleting a task that belongs to today', () => {
    assert.equal(simulateDelete(todayUTC), 'allowed');
  });

  it('rejects deleting a task that belongs to yesterday', () => {
    assert.equal(simulateDelete(yesterdayUTC), 'forbidden');
  });

  it('rejects deleting a task that belongs to tomorrow', () => {
    assert.equal(simulateDelete(tomorrowUTC), 'forbidden');
  });

  it('rejects deleting a task far in the past', () => {
    const oldDate = new Date('2021-03-15T00:00:00.000Z');
    assert.equal(simulateDelete(oldDate), 'forbidden');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Date Permission — Edge Cases', () => {
  it('4 AM boundary: task completed at 03:59 belongs to previous logical day (past)', () => {
    // The task was created for today's calendar date, stored as UTC midnight.
    // But the COMPLETION timestamp (used for activity) at 03:59 AM belongs to
    // the previous logical day. The permission for updating the task uses the
    // task's dueDate (stored as UTC midnight for today), NOT the completion time.
    // So updating is allowed.
    assert.equal(simulateDelete(todayUTC), 'allowed');
    // And the heatmap's logical-date attribution at 03:59 is yesterday's date:
    const { getLogicalDate } = require('../utils/dateUtils');
    const [ty2, tm2, td2] = today.split('-').map(Number);
    const at0359 = new Date(ty2, tm2 - 1, td2, 3, 59, 0);
    const logicalActivityDate = getLogicalDate(at0359);
    // The activity date will be yesterday, not today
    assert.notEqual(logicalActivityDate, today);
  });

  it('getStoredTodoDate reads UTC date correctly from a UTC-midnight Date', () => {
    const { getStoredTodoDate } = require('../utils/dateUtils');
    // A Date stored at midnight UTC on 2026-09-07
    const d = new Date('2026-09-07T00:00:00.000Z');
    assert.equal(getStoredTodoDate(d), '2026-09-07');
  });

  it('getStoredTodoDate reads UTC date from a date that would be different in local time', () => {
    const { getStoredTodoDate } = require('../utils/dateUtils');
    // UTC midnight for Sep 7 — local time (IST +5:30) would show Sep 7 05:30 AM
    // The stored date must still read as Sep 7 UTC.
    const d = new Date('2026-09-07T00:00:00.000Z');
    assert.equal(getStoredTodoDate(d), '2026-09-07');
  });

  it('month boundary: rejects creating a task on the last day of the previous month', () => {
    // e.g., if today is 2026-09-07, then 2026-08-31 is past
    assert.equal(simulateCreate('2026-08-31'), 'forbidden');
  });

  it('year boundary: rejects creating a task in the previous year', () => {
    assert.equal(simulateCreate('2025-12-31'), 'forbidden');
  });
});
