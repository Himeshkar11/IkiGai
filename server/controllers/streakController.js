const Todo = require('../models/Todo');
const { getCompletedActivity } = require('../services/todoActivityService');
const {
  getLogicalDate,
  getPreviousLogicalDate,
} = require('../utils/dateUtils');

const dateBounds = (date) => ({
  start: new Date(`${date}T00:00:00.000Z`),
  end: new Date(`${date}T23:59:59.999Z`),
});

const getLongestStreak = (activeDates) => {
  let longestStreak = 0;
  let runningStreak = 0;
  let previousDate = null;

  activeDates.forEach((date) => {
    if (previousDate && getPreviousLogicalDate(date) === previousDate) {
      runningStreak += 1;
    } else {
      runningStreak = 1;
    }

    longestStreak = Math.max(longestStreak, runningStreak);
    previousDate = date;
  });

  return longestStreak;
};

const getCurrentStreak = (today, activityByDate) => {
  if (!activityByDate.has(today)) return 0;

  let streak = 0;
  let date = today;

  while (true) {
    if (!activityByDate.has(date)) break;

    streak += 1;
    date = getPreviousLogicalDate(date);
  }

  return streak;
};

// The current logical day is the only day that can start the current streak.
// An incomplete current day therefore returns 0, even when prior days passed.
const getStreak = async (req, res, next) => {
  try {
    const today = getLogicalDate();
    const { end } = dateBounds(today);

    const [activityByDate, todayTodos] = await Promise.all([
      getCompletedActivity(req.user.userId, new Date(0), new Date(Date.now() + 1)),
      Todo.find({
        userId: req.user.userId,
        dueDate: { $gte: new Date(`${today}T00:00:00.000Z`), $lte: end },
      }).select('completed').lean(),
    ]);

    const activeDates = [...activityByDate.keys()].sort();
    const completed = todayTodos.filter((todo) => todo.completed).length;
    const total = todayTodos.length;

    res.status(200).json({
      success: true,
      currentStreak: getCurrentStreak(today, activityByDate),
      longestStreak: getLongestStreak(activeDates),
      today: {
        date: today,
        total,
        completed,
        isComplete: activityByDate.has(today),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getStreak };