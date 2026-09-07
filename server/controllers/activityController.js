const {
  getLogicalDate,
  getLogicalMonthBounds,
  getLogicalMonthKey,
} = require('../utils/dateUtils');
const { getCompletedActivity } = require('../services/todoActivityService');

const getMonthActivity = async (req, res, next) => {
  try {
    const month = String(req.query.month || getLogicalMonthKey()).trim();
    const bounds = getLogicalMonthBounds(month);
    const currentMonth = getLogicalMonthKey();

    if (!bounds) {
      return res.status(400).json({
        success: false,
        message: 'A valid month query (YYYY-MM) is required',
      });
    }

    if (month > currentMonth) {
      return res.status(400).json({
        success: false,
        message: 'Future months are not available',
      });
    }

    const activityByDate = await getCompletedActivity(req.user.userId, bounds.start, bounds.end);
    const today = getLogicalDate();
    const activity = [...activityByDate.entries()]
      .filter(([date]) => date.startsWith(month) && date <= today)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, count]) => ({ date, count }));

    res.status(200).json({
      success: true,
      month,
      totalCompleted: activity.reduce((total, day) => total + day.count, 0),
      activeDays: activity.length,
      activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonthActivity };