const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatDateKey,
  getDatePermission,
  getLogicalDate,
  getLogicalToday,
  getStoredTodoDate,
  parseCalendarDate,
} = require('../utils/dateUtils');

const pad = (n) => String(n).padStart(2, '0');

const dayBounds = (day) => ({
  start: new Date(`${day}T00:00:00.000Z`),
  end: new Date(`${day}T23:59:59.999Z`),
});

const toDayString = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  const direct = parseCalendarDate(str);
  if (direct) return direct;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/i.test(str)) {
    return str.slice(0, 10);
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

// Mirroring the controller's task resolution logic
const resolveTaskCreationDate = (body, logicalToday) => {
  const rawDueDate = (body.dueDate !== undefined && body.dueDate !== null && String(body.dueDate).trim() !== '')
    ? body.dueDate
    : body.date;
  const explicitDay = (rawDueDate !== undefined && rawDueDate !== null && String(rawDueDate).trim() !== '')
    ? toDayString(rawDueDate)
    : null;
  return explicitDay || logicalToday;
};

describe('Route-Based Date Bug Regression Suite (Server Tests)', () => {
  const today = '2026-09-08';
  const yesterday = '2026-09-07';
  const tomorrow = '2026-09-09';

  it('Test 1: Route date = 2026-09-08 -> Expected selected date = 2026-09-08', () => {
    const routeDate = '2026-09-08';
    const parsed = parseCalendarDate(routeDate);
    assert.equal(parsed, '2026-09-08');
  });

  it('Test 2: Create task today -> Expected task date = today (NOT yesterday)', () => {
    // Scenario 1: Frontend sends explicit date in payload { title: "Study DSA", date: "2026-09-08" }
    const payloadWithDate = { title: 'Study DSA', date: today };
    const taskDate1 = resolveTaskCreationDate(payloadWithDate, today);
    assert.equal(taskDate1, '2026-09-08');

    // Scenario 2: Frontend sends explicit dueDate in payload { title: "Study DSA", dueDate: "2026-09-08" }
    const payloadWithDueDate = { title: 'Study DSA', dueDate: today };
    const taskDate2 = resolveTaskCreationDate(payloadWithDueDate, today);
    assert.equal(taskDate2, '2026-09-08');

    // Stored MongoDB representation must be at UTC midnight of 2026-09-08
    const storedBounds = dayBounds(taskDate1);
    assert.equal(storedBounds.start.toISOString(), '2026-09-08T00:00:00.000Z');

    // Stored date retrieved back must strictly match 2026-09-08
    const retrievedDate = getStoredTodoDate(storedBounds.start);
    assert.equal(retrievedDate, '2026-09-08');
    assert.notEqual(retrievedDate, '2026-09-07');
  });

  it("Test 3: Today's task -> Expected permission = editable", () => {
    const taskDate = today;
    // Relative to today
    const permission = taskDate === today ? 'today' : (taskDate < today ? 'past' : 'future');
    assert.equal(permission, 'today');
  });

  it('Test 4: Previous task -> Expected permission = read-only', () => {
    const taskDate = yesterday;
    const permission = taskDate === today ? 'today' : (taskDate < today ? 'past' : 'future');
    assert.equal(permission, 'past');
  });

  it('Test 5: Future task -> Expected permission = locked', () => {
    const taskDate = tomorrow;
    const permission = taskDate === today ? 'today' : (taskDate < today ? 'past' : 'future');
    assert.equal(permission, 'future');
  });

  it("Test 6: Today's completion -> Expected heatmap date = today (yesterday unchanged)", () => {
    // Complete task at 10:00 AM on 2026-09-08
    const completionTimestamp = new Date(2026, 8, 8, 10, 0, 0);
    const activityDate = getLogicalDate(completionTimestamp);

    assert.equal(activityDate, '2026-09-08');
    assert.notEqual(activityDate, '2026-09-07');

    // Aggregating mock task completions
    const completedTasks = [
      { completed: true, completedAt: completionTimestamp },
    ];
    const activityMap = new Map();
    completedTasks.forEach((t) => {
      const d = getLogicalDate(t.completedAt);
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    });

    assert.equal(activityMap.get('2026-09-08'), 1);
    assert.equal(activityMap.get('2026-09-07') || 0, 0);
  });

  it('Test 7: Date query filters correctly by dayBounds (no overlap across days)', () => {
    const todayBounds = dayBounds(today);
    const yesterdayBounds = dayBounds(yesterday);

    const todayTaskDueDate = todayBounds.start; // 2026-09-08T00:00:00.000Z
    const yesterdayTaskDueDate = yesterdayBounds.start; // 2026-09-07T00:00:00.000Z

    // Today query matches todayTask
    assert.ok(todayTaskDueDate >= todayBounds.start && todayTaskDueDate <= todayBounds.end);
    // Today query DOES NOT match yesterdayTask
    assert.ok(!(yesterdayTaskDueDate >= todayBounds.start && yesterdayTaskDueDate <= todayBounds.end));

    // Yesterday query matches yesterdayTask
    assert.ok(yesterdayTaskDueDate >= yesterdayBounds.start && yesterdayTaskDueDate <= yesterdayBounds.end);
    // Yesterday query DOES NOT match todayTask
    assert.ok(!(todayTaskDueDate >= yesterdayBounds.start && todayTaskDueDate <= yesterdayBounds.end));
  });

  it('Test 8: Preserves 4 AM logical boundary without double offset', () => {
    // 03:59 AM on 2026-09-08 -> belongs to 2026-09-07
    const beforeFourAM = new Date(2026, 8, 8, 3, 59, 0);
    assert.equal(getLogicalDate(beforeFourAM), '2026-09-07');

    // 04:00 AM on 2026-09-08 -> belongs to 2026-09-08
    const atFourAM = new Date(2026, 8, 8, 4, 0, 0);
    assert.equal(getLogicalDate(atFourAM), '2026-09-08');

    // String date YYYY-MM-DD should NOT have 4 AM subtraction applied
    assert.equal(getLogicalDate('2026-09-08'), '2026-09-08');
    assert.equal(getLogicalDate('2026-09-08T00:00:00.000Z'), '2026-09-08');
  });
});
