const pad = (part) => String(part).padStart(2, '0');

export const getActivityLevel = (completedTaskCount) => {
  const count = Number(completedTaskCount) || 0;
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 7) return 3;
  return 4;
};

export const parseCalendarDate = (value) => {
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

export const extractRouteDate = (pathname, search) => {
  if (search) {
    const params = new URLSearchParams(search);
    const qDate = params.get('date') || params.get('day');
    const parsed = parseCalendarDate(qDate);
    if (parsed) return parsed;
  }

  const match = /^\/(?:tasks|todo|day|home)\/([^/?#]+)/i.exec(pathname || '');
  if (match) {
    const parsed = parseCalendarDate(match[1]);
    if (parsed) return parsed;
  }

  return null;
};

export const addDaysToDate = (dateString, delta = 0) => {
  const parsed = parseCalendarDate(dateString);
  if (!parsed) return null;

  const [y, m, d] = parsed.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta, 12, 0, 0);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const formatCalendarDisplay = (dateString, options = { weekday: 'long', month: 'long', day: 'numeric' }) => {
  const parsed = parseCalendarDate(dateString);
  if (!parsed) return '';

  const [y, m, d] = parsed.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toLocaleDateString(undefined, options);
};

export const getLogicalDate = (value = new Date()) => {
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    // Stored calendar dates at UTC midnight should preserve their date string
    if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/i.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  if (date.getHours() < 4) {
    date.setDate(date.getDate() - 1);
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const getActivityDate = (taskOrDate) => {
  if (!taskOrDate) return null;

  if (typeof taskOrDate === 'object' && !(taskOrDate instanceof Date)) {
    if (!taskOrDate.completed) return null;
    const timestamp = taskOrDate.completedAt || taskOrDate.updatedAt;
    return getLogicalDate(timestamp);
  }

  return getLogicalDate(taskOrDate);
};

export const aggregateTasksByDate = (tasks = [], options = {}) => {
  const counts = {};
  const maxDate = options.maxDate !== undefined ? options.maxDate : getLogicalDate();

  tasks.forEach((task) => {
    if (!task) return;
    const isCompleted = task.completed === true || (task.completed === undefined && (task.completedAt || task.updatedAt));
    if (!isCompleted) return;

    // The task's completion date is authoritative
    const date = getActivityDate(task);
    if (!date) return;

    if (maxDate && date > maxDate) {
      // Future tasks are ignored
      return;
    }

    counts[date] = (counts[date] || 0) + 1;
  });

  return counts;
};

export const getMonthKey = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}`;
};

export const getLogicalMonthKey = (date = new Date()) => {
  const logicalDate = getLogicalDate(date);
  return logicalDate ? logicalDate.slice(0, 7) : null;
};

export const toMonthDate = (month) => {
  const [year, monthNumber] = String(month).split('-').map(Number);
  return new Date(year, monthNumber - 1, 1, 12);
};

export const generateMonthGrid = (month) => {
  const first = toMonthDate(month);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const leading = (first.getDay() + 6) % 7; // Monday = 0
  const cells = Array.from({ length: leading }, () => null);

  for (let day = 1; day <= last.getDate(); day += 1) {
    cells.push(new Date(first.getFullYear(), first.getMonth(), day, 12));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

/**
 * Returns today's logical date string (YYYY-MM-DD) applying the 4 AM boundary.
 * Before 04:00 AM the logical day is still "yesterday".
 */
export const getLogicalToday = () => getLogicalDate(new Date());

/**
 * Compares a date string (YYYY-MM-DD) against today's logical date.
 * Returns 'past', 'today', or 'future'.
 *
 * @param {string} dateString - A YYYY-MM-DD date string.
 * @returns {'past'|'today'|'future'}
 */
export const getDatePermission = (dateString) => {
  const today = getLogicalToday();
  if (!dateString || !today) return 'past'; // safe fallback
  if (dateString < today) return 'past';
  if (dateString > today) return 'future';
  return 'today';
};