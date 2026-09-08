const pad = (value) => String(value).padStart(2, '0');

const formatDateKey = (date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

const parseDateKey = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseMonthKey = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const [, year, month] = match;
  const date = new Date(Number(year), Number(month) - 1, 1, 12);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== Number(month) - 1) return null;
  return date;
};

const getMonthKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

const getLogicalMonthKey = (value = new Date()) => {
  const logicalDate = getLogicalDate(value);
  return logicalDate ? logicalDate.slice(0, 7) : null;
};

const getLogicalMonthBounds = (month) => {
  const date = parseMonthKey(month);
  if (!date) return null;

  // Query window covering all potential tasks for the month (including timezone buffers).
  // Exact day-by-day inclusion is authoritatively determined by getLogicalDate.
  return {
    start: new Date(date.getFullYear(), date.getMonth() - 1, 28, 0, 0, 0, 0),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 3, 0, 0, 0, 0),
  };
};

// Todo due dates are stored at UTC midnight as date-only values. Preserve that
// calendar label instead of applying the local 4 AM clock boundary to it.
const getStoredTodoDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
};

const parseCalendarDate = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (str.toLowerCase() === 'today') {
    return getLogicalToday();
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (!match) return null;

  const [, yStr, mStr, dStr] = match;
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  const date = new Date(y, m - 1, d, 12, 0, 0);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return `${y}-${pad(m)}-${pad(d)}`;
};

const getLogicalDate = (value = new Date()) => {
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/i.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (date.getHours() < 4) {
    date.setDate(date.getDate() - 1);
  }

  return formatDateKey(date);
};

const getPreviousLogicalDate = (value) => {
  const date = parseDateKey(value);
  if (!date) return null;

  date.setDate(date.getDate() - 1);
  return formatDateKey(date);
};

/**
 * Returns today's logical date string (YYYY-MM-DD) applying the 4 AM boundary.
 * Before 04:00 AM the logical day is still "yesterday".
 */
const getLogicalToday = () => getLogicalDate(new Date());

/**
 * Compares a stored date string (YYYY-MM-DD) against today's logical date.
 * Returns 'past', 'today', or 'future'.
 *
 * @param {string} dateString - A YYYY-MM-DD date string representing the task's day.
 * @returns {'past'|'today'|'future'}
 */
const getDatePermission = (dateString) => {
  const today = getLogicalToday();
  if (!dateString || !today) return 'past'; // safe fallback — treat unknown as read-only
  if (dateString < today) return 'past';
  if (dateString > today) return 'future';
  return 'today';
};

/**
 * Convenience helper — returns true only when dateString is today's logical date.
 *
 * @param {string} dateString - A YYYY-MM-DD date string.
 * @returns {boolean}
 */
const isTodayDate = (dateString) => getDatePermission(dateString) === 'today';

module.exports = {
  formatDateKey,
  getDatePermission,
  getLogicalDate,
  getLogicalMonthBounds,
  getLogicalMonthKey,
  getLogicalToday,
  getMonthKey,
  getPreviousLogicalDate,
  getStoredTodoDate,
  isTodayDate,
  parseCalendarDate,
  parseDateKey,
};
