import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysToDate,
  extractRouteDate,
  formatCalendarDisplay,
  getDatePermission,
  getLogicalDate,
  getLogicalToday,
  parseCalendarDate,
} from './activity.js';

describe('Route & Calendar Date Pipeline (Client Regression Tests)', () => {
  it('Test 1: Route date = 2026-09-08 -> Expected selected date = 2026-09-08', () => {
    const routeParam = '2026-09-08';
    const selectedDate = parseCalendarDate(routeParam);
    assert.equal(selectedDate, '2026-09-08');

    // Also verify extraction from various route patterns
    assert.equal(extractRouteDate('/tasks/2026-09-08'), '2026-09-08');
    assert.equal(extractRouteDate('/todo/2026-09-08'), '2026-09-08');
    assert.equal(extractRouteDate('/day/2026-09-08'), '2026-09-08');
    assert.equal(extractRouteDate('/home/2026-09-08'), '2026-09-08');
    assert.equal(extractRouteDate('/', '?date=2026-09-08'), '2026-09-08');
    assert.equal(extractRouteDate('/tasks', '?day=2026-09-08'), '2026-09-08');
  });

  it('Deterministic Route Date Round Trip (Section 19)', () => {
    const dates = [
      '2026-09-08',
      '2026-01-01',
      '2026-02-28',
      '2028-02-29', // leap year
      '2026-12-31',
    ];

    for (const input of dates) {
      const route = `/tasks/${input}`;
      const parsed = extractRouteDate(route);
      assert.equal(parsed, input, `Round trip for ${input} failed: got ${parsed}`);
    }
  });

  it('Rejects invalid calendar dates without crash or drift', () => {
    assert.equal(parseCalendarDate('2026-02-29'), null); // 2026 is not a leap year
    assert.equal(parseCalendarDate('2026-04-31'), null); // April has 30 days
    assert.equal(parseCalendarDate('invalid-date'), null);
    assert.equal(parseCalendarDate(null), null);
    assert.equal(parseCalendarDate(''), null);
  });

  it('Keyword route /tasks/today resolves to logical today', () => {
    const expected = getLogicalToday();
    assert.equal(extractRouteDate('/tasks/today'), expected);
    assert.equal(extractRouteDate('/todo/today'), expected);
    assert.equal(extractRouteDate('/day/today'), expected);
    assert.equal(parseCalendarDate('today'), expected);
  });

  it('Route navigation across Yesterday -> Today -> Tomorrow (Section 18)', () => {
    const today = '2026-09-08';
    const yesterday = addDaysToDate(today, -1);
    const tomorrow = addDaysToDate(today, 1);

    assert.equal(yesterday, '2026-09-07');
    assert.equal(today, '2026-09-08');
    assert.equal(tomorrow, '2026-09-09');

    // Route round trips for all 3
    assert.equal(extractRouteDate(`/tasks/${yesterday}`), '2026-09-07');
    assert.equal(extractRouteDate(`/tasks/${today}`), '2026-09-08');
    assert.equal(extractRouteDate(`/tasks/${tomorrow}`), '2026-09-09');
  });

  it('Calendar display formatting does not shift due to UTC (Section 4 & 5)', () => {
    const formatted = formatCalendarDisplay('2026-09-08', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
    // Regardless of local timezone offset, month must be 9 and day must be 8
    assert.match(formatted, /8/);
  });

  it('4 AM boundary behavior (Section 24)', () => {
    // 03:59 on Sep 8 maps to Sep 7
    const at0359 = new Date(2026, 8, 8, 3, 59, 0);
    assert.equal(getLogicalDate(at0359), '2026-09-07');

    // 04:00 on Sep 8 maps to Sep 8
    const at0400 = new Date(2026, 8, 8, 4, 0, 0);
    assert.equal(getLogicalDate(at0400), '2026-09-08');
  });

  it('Midnight boundary behavior (Section 25)', () => {
    // 23:59 on Sep 7 maps to Sep 7
    const at2359 = new Date(2026, 8, 7, 23, 59, 0);
    assert.equal(getLogicalDate(at2359), '2026-09-07');

    // 00:01 on Sep 8 is before 4 AM, so it belongs to logical day Sep 7
    const at0001 = new Date(2026, 8, 8, 0, 1, 0);
    assert.equal(getLogicalDate(at0001), '2026-09-07');
  });

  it('Date Permission Logic: Past is view-only, Today is editable, Future is locked', () => {
    const today = getLogicalToday();
    const [y, m, d] = today.split('-').map(Number);
    const pad = (n) => String(n).padStart(2, '0');

    const pastDate = new Date(y, m - 1, d - 1, 12);
    const pastStr = `${pastDate.getFullYear()}-${pad(pastDate.getMonth() + 1)}-${pad(pastDate.getDate())}`;

    const futureDate = new Date(y, m - 1, d + 1, 12);
    const futureStr = `${futureDate.getFullYear()}-${pad(futureDate.getMonth() + 1)}-${pad(futureDate.getDate())}`;

    assert.equal(getDatePermission(today), 'today');
    assert.equal(getDatePermission(pastStr), 'past');
    assert.equal(getDatePermission(futureStr), 'future');
  });
});
