const mongoose = require('mongoose');
const Todo = require('../models/Todo');

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
    const day = toDayString(req.body.dueDate);
    const priority = normalizePriority(req.body.priority);

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!day) {
      return res.status(400).json({ success: false, message: 'A valid dueDate (YYYY-MM-DD) is required' });
    }
    if (!priority) {
      return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
    }

    const todo = await Todo.create({
      userId,
      title,
      description: req.body.description ? String(req.body.description).trim() : undefined,
      dueDate: dayBounds(day).start,
      completed: Boolean(req.body.completed),
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
    if (req.body.completed !== undefined) {
      updates.completed = Boolean(req.body.completed);
    }
    if (req.body.priority !== undefined) {
      const priority = normalizePriority(req.body.priority);
      if (!priority) {
        return res.status(400).json({ success: false, message: 'Priority must be low, medium, or high' });
      }
      updates.priority = priority;
    }
    if (req.body.dueDate !== undefined) {
      const day = toDayString(req.body.dueDate);
      if (!day) {
        return res.status(400).json({ success: false, message: 'A valid dueDate (YYYY-MM-DD) is required' });
      }
      updates.dueDate = dayBounds(day).start;
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true, runValidators: true },
    );

    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

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

    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

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
