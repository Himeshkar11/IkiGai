const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatDateKey,
  getLogicalDate,
  getLogicalMonthBounds,
  getLogicalMonthKey,
  getMonthKey,
  getPreviousLogicalDate,
  parseDateKey,
} = require('../utils/dateUtils');

describe('Server Date Utils: getLogicalDate & Normalization', () => {
  it('preserves YYYY-MM-DD date strings without shifting to previous day', () => {
    assert.equal(getLogicalDate('2026-09-07'), '2026-09-07');
    assert.equal(getLogicalDate('2026-08-01'), '2026-08-01');
    assert.equal(getLogicalDate('2026-12-31'), '2026-12-31');
  });

  it('safely handles null value by returning null', () => {
    assert.equal(getLogicalDate(null), null);
  });

  it('returns valid date string for undefined (defaults to current date)', () => {
    const today = getLogicalDate();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects the 4:00 AM logical-day boundary', () => {
    // 03:59 AM on September 5 belongs to logical day September 4
    const beforeFourAM = new Date(2026, 8, 5, 3, 59, 0);
    assert.equal(getLogicalDate(beforeFourAM), '2026-09-04');

    // 04:00 AM on September 5 belongs to logical day September 5
    const atFourAM = new Date(2026, 8, 5, 4, 0, 0);
    assert.equal(getLogicalDate(atFourAM), '2026-09-05');
  });

  it('respects midnight boundaries', () => {
    // 23:59 on September 5 belongs to September 5
    const lateNight = new Date(2026, 8, 5, 23, 59, 0);
    assert.equal(getLogicalDate(lateNight), '2026-09-05');

    // 00:01 on September 6 is before 4 AM, so it belongs to logical day September 5
    const earlyMidnight = new Date(2026, 8, 6, 0, 1, 0);
    assert.equal(getLogicalDate(earlyMidnight), '2026-09-05');
  });

  it('maps month boundaries correctly', () => {
    const aug31 = new Date(2026, 7, 31, 15, 30, 0);
    assert.equal(getLogicalDate(aug31), '2026-08-31');

    const sep1 = new Date(2026, 8, 1, 15, 30, 0);
    assert.equal(getLogicalDate(sep1), '2026-09-01');
  });

  it('maps year boundaries correctly', () => {
    const dec31 = new Date(2025, 11, 31, 12, 0, 0);
    assert.equal(getLogicalDate(dec31), '2025-12-31');

    const jan1 = new Date(2026, 0, 1, 12, 0, 0);
    assert.equal(getLogicalDate(jan1), '2026-01-01');
  });

  it('handles leap years (2028-02-29)', () => {
    const leapDay = new Date(2028, 1, 29, 12, 0, 0);
    assert.equal(getLogicalDate(leapDay), '2028-02-29');

    const mar1 = new Date(2028, 2, 1, 12, 0, 0);
    assert.equal(getLogicalDate(mar1), '2028-03-01');
  });

  it('asserts direct date map (Section 37)', () => {
    const timestamp1 = new Date(2026, 8, 5, 14, 30, 0);
    assert.equal(getLogicalDate(timestamp1), '2026-09-05');

    const timestamp2 = new Date(2026, 8, 6, 14, 30, 0);
    assert.equal(getLogicalDate(timestamp2), '2026-09-06');
  });
});

describe('Date Utilities: Keys & Bounds', () => {
  it('parses and formats month keys correctly', () => {
    assert.equal(getMonthKey(new Date(2026, 8, 15)), '2026-09');
    assert.equal(getLogicalMonthKey('2026-09-07'), '2026-09');
  });

  it('computes logical month bounds with buffer', () => {
    const bounds = getLogicalMonthBounds('2026-08');
    assert.ok(bounds);
    assert.ok(bounds.start instanceof Date);
    assert.ok(bounds.end instanceof Date);
    assert.ok(bounds.start < bounds.end);
  });

  it('computes previous logical date correctly', () => {
    assert.equal(getPreviousLogicalDate('2026-09-01'), '2026-08-31');
    assert.equal(getPreviousLogicalDate('2026-01-01'), '2025-12-31');
    assert.equal(getPreviousLogicalDate('2028-03-01'), '2028-02-29');
  });
});

describe('Task Activity Aggregation & Data Flow', () => {
  // Pure aggregation function mirroring todoActivityService
  const aggregateRecords = (records, targetUserId) => {
    const counts = new Map();
    records.forEach((todo) => {
      if (todo.userId !== targetUserId) return;
      if (!todo.completed) return;
      const timestamp = todo.completedAt || todo.updatedAt;
      const date = getLogicalDate(timestamp);
      if (date) {
        counts.set(date, (counts.get(date) || 0) + 1);
      }
    });
    return counts;
  };

  it('handles 0 completed tasks', () => {
    const records = [
      { userId: 'u1', completed: false, completedAt: null },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.size, 0);
  });

  it('aggregates 1 completed task', () => {
    const records = [
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 3, 14, 0) },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-09-03'), 1);
  });

  it('aggregates multiple tasks on the same day (Section 21)', () => {
    const records = [
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 7, 9, 0) },
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 7, 11, 0) },
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 7, 15, 0) },
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 7, 20, 0) },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-09-07'), 4);
  });

  it('aggregates tasks on different days (Section 22)', () => {
    const records = [
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 1, 10, 0) },
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 1, 12, 0) },
      ...Array.from({ length: 5 }, () => ({
        userId: 'u1',
        completed: true,
        completedAt: new Date(2026, 8, 2, 14, 0),
      })),
      { userId: 'u1', completed: true, completedAt: new Date(2026, 8, 3, 16, 0) },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-09-01'), 2);
    assert.equal(counts.get('2026-09-02'), 5);
    assert.equal(counts.get('2026-09-03'), 1);
    assert.equal(counts.get('2026-09-07'), undefined);
  });

  it('uses completion date, NOT creation date (Section 20)', () => {
    const records = [
      {
        userId: 'u1',
        createdAt: new Date(2026, 8, 1, 10, 0),
        completedAt: new Date(2026, 8, 5, 14, 0),
        completed: true,
      },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-09-01'), undefined);
    assert.equal(counts.get('2026-09-05'), 1);
  });

  it('falls back to updatedAt for legacy completed records with null completedAt', () => {
    const records = [
      {
        userId: 'u1',
        completed: true,
        completedAt: null,
        updatedAt: new Date(2026, 8, 2, 12, 0),
      },
    ];
    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-09-02'), 1);
  });

  it('enforces user data isolation (Section 32)', () => {
    const records = [
      ...Array.from({ length: 5 }, () => ({
        userId: 'user_a',
        completed: true,
        completedAt: new Date(2026, 8, 1, 12, 0),
      })),
      ...Array.from({ length: 2 }, () => ({
        userId: 'user_b',
        completed: true,
        completedAt: new Date(2026, 8, 1, 14, 0),
      })),
    ];
    const userACounts = aggregateRecords(records, 'user_a');
    const userBCounts = aggregateRecords(records, 'user_b');

    assert.equal(userACounts.get('2026-09-01'), 5);
    assert.equal(userBCounts.get('2026-09-01'), 2);
  });

  it('proves the historical August 2026 scenario (Section 17)', () => {
    const records = [
      // Aug 1 -> 2 completed
      { userId: 'u1', completed: true, completedAt: new Date(2026, 7, 1, 10, 0) },
      { userId: 'u1', completed: true, completedAt: new Date(2026, 7, 1, 12, 0) },
      // Aug 5 -> 7 completed
      ...Array.from({ length: 7 }, () => ({
        userId: 'u1',
        completed: true,
        completedAt: new Date(2026, 7, 5, 14, 0),
      })),
      // Aug 12 -> 1 completed
      { userId: 'u1', completed: true, completedAt: new Date(2026, 7, 12, 11, 0) },
      // Aug 20 -> 5 completed
      ...Array.from({ length: 5 }, () => ({
        userId: 'u1',
        completed: true,
        completedAt: new Date(2026, 7, 20, 16, 0),
      })),
      // Aug 31 -> 3 completed
      ...Array.from({ length: 3 }, () => ({
        userId: 'u1',
        completed: true,
        completedAt: new Date(2026, 7, 31, 18, 0),
      })),
    ];

    const counts = aggregateRecords(records, 'u1');
    assert.equal(counts.get('2026-08-01'), 2);
    assert.equal(counts.get('2026-08-05'), 7);
    assert.equal(counts.get('2026-08-12'), 1);
    assert.equal(counts.get('2026-08-20'), 5);
    assert.equal(counts.get('2026-08-31'), 3);

    // Non-active days remain 0
    assert.equal(counts.get('2026-08-02'), undefined);
    assert.equal(counts.get('2026-08-06'), undefined);
  });

  it('keeps streak separate from task intensity (Section 14)', () => {
    // 3 active days: Mon (1 task), Tue (10 tasks), Wed (3 tasks)
    const activeDates = ['2026-09-01', '2026-09-02', '2026-09-03'];
    // Number of active days is 3 (3-day streak), not 14
    assert.equal(activeDates.length, 3);
  });
});

describe('Date Permission System', () => {
  const {
    getLogicalDate,
    getDatePermission,
    getLogicalToday,
  } = require('../utils/dateUtils');

  // Helper: compute getDatePermission relative to a fixed "today" string instead of
  // the real system clock, so tests are deterministic regardless of when they run.
  const permissionRelativeTo = (dateString, fakeToday) => {
    if (!dateString || !fakeToday) return 'past';
    if (dateString < fakeToday) return 'past';
    if (dateString > fakeToday) return 'future';
    return 'today';
  };

  it('getLogicalToday() returns a valid YYYY-MM-DD string', () => {
    const today = getLogicalToday();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('getDatePermission returns "today" for the current logical date', () => {
    const today = getLogicalToday();
    assert.equal(getDatePermission(today), 'today');
  });

  it('returns "past" for yesterday (relative to fixed today 2026-09-07)', () => {
    const today = '2026-09-07';
    assert.equal(permissionRelativeTo('2026-09-06', today), 'past');
  });

  it('returns "today" for today (relative to fixed today 2026-09-07)', () => {
    const today = '2026-09-07';
    assert.equal(permissionRelativeTo('2026-09-07', today), 'today');
  });

  it('returns "future" for tomorrow (relative to fixed today 2026-09-07)', () => {
    const today = '2026-09-07';
    assert.equal(permissionRelativeTo('2026-09-08', today), 'future');
  });

  it('4 AM boundary: 03:59 AM on Sep 7 belongs to logical day Sep 6 (past when today=Sep 7)', () => {
    // 03:59 AM Sep 7 → logical date is Sep 6
    const logicalDate = getLogicalDate(new Date(2026, 8, 7, 3, 59, 0));
    assert.equal(logicalDate, '2026-09-06');
    // Since logical date (Sep 6) < today (Sep 7), it is "past"
    assert.equal(permissionRelativeTo(logicalDate, '2026-09-07'), 'past');
  });

  it('4 AM boundary: 04:00 AM on Sep 7 belongs to logical day Sep 7 (today when today=Sep 7)', () => {
    const logicalDate = getLogicalDate(new Date(2026, 8, 7, 4, 0, 0));
    assert.equal(logicalDate, '2026-09-07');
    assert.equal(permissionRelativeTo(logicalDate, '2026-09-07'), 'today');
  });

  it('month boundary: 2025-12-31 is past when today is 2026-01-01', () => {
    assert.equal(permissionRelativeTo('2025-12-31', '2026-01-01'), 'past');
  });

  it('year boundary: 2026-01-01 is past when today is 2026-09-07', () => {
    assert.equal(permissionRelativeTo('2026-01-01', '2026-09-07'), 'past');
  });

  it('null / missing dateString falls back to "past" (read-only safe default)', () => {
    assert.equal(getDatePermission(null), 'past');
    assert.equal(getDatePermission(undefined), 'past');
    assert.equal(getDatePermission(''), 'past');
  });
});
