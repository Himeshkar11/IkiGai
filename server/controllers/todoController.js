const mongoose = require('mongoose');
const Todo = require('../models/Todo');
const { getStoredTodoDate, getDatePermission, getLogicalToday } = require('../utils/dateUtils');

const DATE_LOCK_MSG = 'Tasks can only be modified for the current day.';

const pad = (n) => String(n).padStart(2, '0');

const toDayString = (value) => {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const dayBounds = (day) => ({
  start: new Date(`${day}T00:00:00.000Z`),
  end: new Date(`${day}T23:59:59.999Z`),
});

const PRIORITIES = ['low', 'medium', 'high'];

const normalizePriority = (value) => {
  if (!value) return 'medium';
  if (value === 'normal') return 'medium';
  return PRIORITIES.includes(value) ? value : null;
};

// GET /api/todos?date=YYYY-MM-DD
const getTodos = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const day = toDayString(req.query.date);
    if (!day) {
      return res.status(400).json({
        success: false,
        message: 'A valid date query (YYYY-MM-DD) is required',
      });
    }

    const { start, end } = dayBounds(day);
    const todos = await Todo.find({
      userId,
      dueDate: { $gte: start, $lte: end },
    }).sort({ completed: 1, createdAt: 1 });

    const completed = todos.filter((t) => t.completed).length;

    res.status(200).json({
      success: true,
      date: day,
      todos,
      total: todos.length,
      completed,
      remaining: todos.length - completed,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/todos
const createTodo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const title = String(req.body.title || '').trim();
    const rawDueDate = req.body.dueDate;
    const explicitDay = (rawDueDate !== undefined && rawDueDate !== null && String(rawDueDate).trim() !== '')
      ? toDayString(rawDueDate)
      : null;
    const day = explicitDay || getLogicalToday();
    const priority = normalizePriority(req.body.priority);

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (rawDueDate !== undefined && rawDueDate !== null && String(rawDueDate).trim() !== '' && !explicitDay) {
      return res.status(400).json({ success: false, message: 'A valid dueDate (YYYY-MM-DD) is required' });
    }
    if (!priority) {
      return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
    }
    // Date-permission guard: allow a normal create request to default to today,
    // while still refusing legacy or explicit past/future dates.
    if (explicitDay && getDatePermission(explicitDay) !== 'today') {
      return res.status(403).json({ success: false, message: DATE_LOCK_MSG });
    }

    const completed = Boolean(req.body.completed);
    let completedAt = null;
    if (completed) {
      completedAt = req.body.completedAt ? new Date(req.body.completedAt) : new Date();
    } else if (req.body.completedAt) {
      completedAt = new Date(req.body.completedAt);
    }

    const todo = await Todo.create({
      userId,
      title,
      description: req.body.description ? String(req.body.description).trim() : undefined,
      dueDate: dayBounds(day).start,
      completed,
      completedAt,
      priority,
    });

    res.status(201).json({ success: true, todo });
  } catch (error) {
    next(error);
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const updates = {};
    if (req.body.title !== undefined) {
      const title = String(req.body.title).trim();
      if (!title) {
        return res.status(400).json({ success: false, message: 'Title is required' });
      }
      updates.title = title;
    }
    if (req.body.description !== undefined) {
      updates.description = String(req.body.description).trim();
    }
    const currentTodo = await Todo.findOne({ _id: id, userId }).select('completed completedAt dueDate');
    if (!currentTodo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    // Date-permission guard: the task must belong to today's logical date.
    const taskDate = getStoredTodoDate(currentTodo.dueDate);
    if (getDatePermission(taskDate) !== 'today') {
      return res.status(403).json({ success: false, message: DATE_LOCK_MSG });
    }

    // Also block attempts to move the task to a non-today date.
    if (req.body.dueDate !== undefined) {
      const newDay = toDayString(req.body.dueDate);
      if (!newDay) {
        return res.status(400).json({ success: false, message: 'A valid dueDate (YYYY-MM-DD) is required' });
      }
      if (getDatePermission(newDay) !== 'today') {
        return res.status(403).json({ success: false, message: DATE_LOCK_MSG });
      }
    }

    if (req.body.completed !== undefined) {
      const completed = Boolean(req.body.completed);
      updates.completed = completed;
      if (completed) {
        updates.completedAt = req.body.completedAt
          ? new Date(req.body.completedAt)
          : (currentTodo.completedAt || new Date());
      } else {
        updates.completedAt = null;
      }
    } else if (req.body.completedAt !== undefined) {
      if (req.body.completedAt === null) {
        updates.completedAt = null;
        updates.completed = false;
      } else {
        updates.completedAt = new Date(req.body.completedAt);
        updates.completed = true;
      }
    }
    if (req.body.priority !== undefined) {
      const priority = normalizePriority(req.body.priority);
      if (!priority) {
        return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
      }
      updates.priority = priority;
    }
    if (req.body.dueDate !== undefined) {
      // newDay already validated and permission-checked above; just apply it.
      const newDay = toDayString(req.body.dueDate);
      if (newDay) updates.dueDate = dayBounds(newDay).start;
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true },
    );

    res.status(200).json({ success: true, todo });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    // Date-permission guard: find the task first to check its date, then delete.
    const todo = await Todo.findOne({ _id: id, userId }).select('dueDate');
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }
    const taskDate = getStoredTodoDate(todo.dueDate);
    if (getDatePermission(taskDate) !== 'today') {
      return res.status(403).json({ success: false, message: DATE_LOCK_MSG });
    }

    await Todo.findOneAndDelete({ _id: id, userId });

    res.status(200).json({ success: true, message: 'Todo deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
};
