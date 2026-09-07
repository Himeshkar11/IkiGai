const Todo = require('../models/Todo');
const { getLogicalDate } = require('../utils/dateUtils');

const getCompletedActivity = async (userId, start, end) => {
  const query = {
    userId,
    completed: true,
  };

  if (start && end) {
    query.$or = [
      { completedAt: { $gte: start, $lt: end } },
      { completedAt: null, updatedAt: { $gte: start, $lt: end } },
      { completedAt: { $exists: false }, updatedAt: { $gte: start, $lt: end } },
    ];
  }

  const todos = await Todo.find(query)
    .select('completedAt updatedAt')
    .lean();

  const counts = new Map();
  todos.forEach((todo) => {
    const timestamp = todo.completedAt || todo.updatedAt;
    const date = getLogicalDate(timestamp);
    if (date) {
      counts.set(date, (counts.get(date) || 0) + 1);
    }
  });

  return counts;
};

module.exports = { getCompletedActivity };