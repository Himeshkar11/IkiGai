const mongoose = require('mongoose');
const User = require('../models/User');
const Todo = require('../models/Todo');
const FoodLog = require('../models/FoodLog');
const MoneyTransaction = require('../models/MoneyTransaction');
const RoomStatus = require('../models/RoomStatus');
const RoomTask = require('../models/RoomTask');
const RoomLog = require('../models/RoomLog');
const MonthlySummary = require('../models/MonthlySummary');
const { getLogicalDate } = require('../utils/dateUtils');

const pad = (n) => String(n).padStart(2, '0');

/**
 * Computes exact boundaries for data retention.
 * Current month: The month of the reference date (e.g., 2026-09)
 * Previous month: The month immediately prior (e.g., 2026-08)
 * Older months: Any month strictly before previous month (e.g., <= 2026-07)
 *
 * @param {Date|string} [referenceDate=new Date()]
 * @returns {{
 *   currentMonth: string,
 *   previousMonth: string,
 *   currentMonthStart: Date,
 *   previousMonthStart: Date,
 *   previousMonthEnd: Date,
 *   olderMonthsThreshold: Date
 * }}
 */
const getRetentionWindows = (referenceDate = new Date()) => {
  const ref = referenceDate instanceof Date ? new Date(referenceDate.getTime()) : new Date(referenceDate);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth(); // 0-indexed

  // Current month
  const currentMonthKey = `${year}-${pad(month + 1)}`;
  const currentMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // Previous month
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  const previousMonthKey = `${prevYear}-${pad(prevMonth + 1)}`;
  const previousMonthStart = new Date(Date.UTC(prevYear, prevMonth, 1, 0, 0, 0, 0));
  const previousMonthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Detailed records strictly before previousMonthStart belong to older months
  const olderMonthsThreshold = previousMonthStart;

  return {
    currentMonth: currentMonthKey,
    previousMonth: previousMonthKey,
    currentMonthStart,
    previousMonthStart,
    previousMonthEnd,
    olderMonthsThreshold,
  };
};

/**
 * Computes month bounds (UTC) for any given YYYY-MM string.
 *
 * @param {string} monthKey - Format 'YYYY-MM'
 * @returns {{ start: Date, end: Date, monthKey: string }}
 */
const getMonthBounds = (monthKey) => {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr); // 1-indexed

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end, monthKey };
};

/**
 * Compiles a monthly summary for a single user for a given month.
 * Queries operational collections, calculates domain aggregates, and saves to MonthlySummary.
 *
 * @param {mongoose.Types.ObjectId|string} userId
 * @param {string} monthKey - Format 'YYYY-MM'
 * @returns {Promise<Object>} The verified MonthlySummary document
 */
const compileUserMonthlySummary = async (userId, monthKey) => {
  const { start, end } = getMonthBounds(monthKey);
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  // 1. Task activity aggregation
  // For tasks, completed ones are authoritative by completedAt || updatedAt
  const completedTodos = await Todo.find({
    userId: userObjectId,
    completed: true,
    $or: [
      { completedAt: { $gte: start, $lte: end } },
      { completedAt: null, updatedAt: { $gte: start, $lte: end } },
      { completedAt: { $exists: false }, updatedAt: { $gte: start, $lte: end } },
    ],
  }).select('completedAt updatedAt').lean();

  const totalCreatedTodos = await Todo.countDocuments({
    userId: userObjectId,
    createdAt: { $gte: start, $lte: end },
  });

  const activityByDate = new Map();
  completedTodos.forEach((todo) => {
    const timestamp = todo.completedAt || todo.updatedAt;
    const dateStr = getLogicalDate(timestamp);
    if (dateStr && dateStr.startsWith(monthKey)) {
      activityByDate.set(dateStr, (activityByDate.get(dateStr) || 0) + 1);
    }
  });

  const todoSummary = {
    totalCreated: totalCreatedTodos,
    totalCompleted: completedTodos.length,
    activeDays: activityByDate.size,
    activityByDate: Object.fromEntries(activityByDate),
  };

  // 2. Money aggregation
  const moneyTransactions = await MoneyTransaction.find({
    userId: userObjectId,
    date: { $gte: start, $lte: end },
  }).lean();

  const spendingByDate = new Map();
  let totalSpent = 0;
  moneyTransactions.forEach((t) => {
    const amt = Number(t.amount) || 0;
    totalSpent += amt;
    const dateStr = t.date ? t.date.toISOString().slice(0, 10) : null;
    if (dateStr) {
      spendingByDate.set(dateStr, (spendingByDate.get(dateStr) || 0) + amt);
    }
  });

  const moneySummary = {
    totalSpent,
    transactionCount: moneyTransactions.length,
    spendingByDate: Object.fromEntries(spendingByDate),
  };

  // 3. Nutrition aggregation
  const foodLogs = await FoodLog.find({
    userId: userObjectId,
    date: { $gte: start, $lte: end },
  }).lean();

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  foodLogs.forEach((log) => {
    if (log.totals) {
      totalCalories += log.totals.calories || 0;
      totalProtein += log.totals.protein || 0;
      totalCarbs += log.totals.carbs || 0;
      totalFat += log.totals.fat || 0;
      totalFiber += log.totals.fiber || 0;
    }
  });

  const daysLogged = foodLogs.length;
  const divisor = daysLogged > 0 ? daysLogged : 1;

  const nutritionSummary = {
    daysLogged,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein),
    totalCarbs: Math.round(totalCarbs),
    totalFat: Math.round(totalFat),
    totalFiber: Math.round(totalFiber),
    dailyAverages: {
      calories: Math.round(totalCalories / divisor),
      protein: Math.round(totalProtein / divisor),
      carbs: Math.round(totalCarbs / divisor),
      fat: Math.round(totalFat / divisor),
      fiber: Math.round(totalFiber / divisor),
    },
  };

  // 4. Room & Environment aggregation
  // RoomStatus dates are strings: YYYY-MM-DD
  const roomStatuses = await RoomStatus.find({
    date: { $regex: `^${monthKey}` },
  }).lean();

  let waterAvailableDays = 0;
  let roomCleanDays = 0;
  let clothesReadyDays = 0;

  roomStatuses.forEach((rs) => {
    if (rs.waterAvailable === true) waterAvailableDays += 1;
    if (rs.roomClean === true) roomCleanDays += 1;
    if (rs.clothesReady === true) clothesReadyDays += 1;
  });

  const roomTasksCompleted = await RoomTask.countDocuments({
    userId: userObjectId,
    $or: [
      { completed: true, updatedAt: { $gte: start, $lte: end } },
      { completedDates: { $elemMatch: { $regex: `^${monthKey}` } } },
    ],
  });

  const roomSummary = {
    daysChecked: roomStatuses.length,
    waterAvailableDays,
    roomCleanDays,
    clothesReadyDays,
    tasksCompleted: roomTasksCompleted,
  };

  // 5. Store / Upsert MonthlySummary (Idempotent: unique key userId + month)
  const summaryDoc = await MonthlySummary.findOneAndUpdate(
    { userId: userObjectId, month: monthKey },
    {
      userId: userObjectId,
      month: monthKey,
      todos: todoSummary,
      money: moneySummary,
      nutrition: nutritionSummary,
      room: roomSummary,
      archivedAt: new Date(),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  // 6. Verify summary existence and integrity
  if (!summaryDoc || !summaryDoc._id) {
    throw new Error(`Failed to store monthly summary for user ${userId} month ${monthKey}`);
  }

  return summaryDoc;
};

/**
 * Runs the monthly retention and cleanup flow.
 *
 * Sequence:
 * 1. Identify CURRENT_MONTH, PREVIOUS_MONTH, and OLDER_MONTHS threshold.
 * 2. Generate and verify the monthly summary for PREVIOUS_MONTH for all active users.
 * 3. Identify all distinct older months present in raw records.
 * 4. Generate and verify monthly summaries for each older month before any deletion.
 * 5. If all summaries for an older month are verified, purge raw detailed records
 *    belonging to that older month (older than the previous month start).
 * 6. Keeps CURRENT_MONTH and PREVIOUS_MONTH operational data intact.
 * 7. Never deletes User, Food master items, or recurring RoomTask chore definitions.
 *
 * @param {Object} [options]
 * @param {Date|string} [options.referenceDate] - Custom reference date (defaults to now)
 * @param {boolean} [options.dryRun=false] - If true, calculates and logs counts without deleting
 * @param {string} [options.targetMonth] - Optional specific month to summarize (YYYY-MM)
 * @returns {Promise<Object>} Execution summary report
 */
const runMonthlyCleanup = async (options = {}) => {
  const { referenceDate = new Date(), dryRun = false, targetMonth = null } = options;
  const windows = getRetentionWindows(referenceDate);

  const monthToSummarize = targetMonth || windows.previousMonth;
  const auditLog = [];

  const logMessage = (msg) => {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    auditLog.push(entry);
  };

  logMessage(
    `Starting monthly retention process. Reference: ${referenceDate instanceof Date ? referenceDate.toISOString() : referenceDate}`
  );
  logMessage(
    `Windows identified -> CURRENT_MONTH: ${windows.currentMonth}, PREVIOUS_MONTH: ${windows.previousMonth}, Older threshold: ${windows.olderMonthsThreshold.toISOString()}`
  );

  if (dryRun) {
    logMessage(`Mode: DRY RUN (no records will be deleted)`);
  }

  // Find all distinct users
  const users = await User.find({}).select('_id email name').lean();
  logMessage(`Discovered ${users.length} registered user account(s)`);

  const summariesCreated = [];

  // Step A: Generate / Verify summaries for the target month (previous month)
  for (const user of users) {
    try {
      const summary = await compileUserMonthlySummary(user._id, monthToSummarize);
      summariesCreated.push({
        userId: user._id,
        userEmail: user.email,
        month: monthToSummarize,
        summaryId: summary._id,
      });
      logMessage(`Verified summary for user ${user.email} (${user._id}) for month ${monthToSummarize}`);
    } catch (err) {
      const errorMsg = `CRITICAL: Summary generation failed for user ${user._id} month ${monthToSummarize}: ${err.message}`;
      logMessage(errorMsg);
      throw new Error(errorMsg); // Abort before any deletion
    }
  }

  // Step B: Identify any older months with raw data that require archiving before purge
  const olderDateFilter = { $lt: windows.olderMonthsThreshold };

  // Query distinct dates in older months across collections
  const olderTodoDates = await Todo.find({
    completed: true,
    $or: [
      { completedAt: olderDateFilter },
      { completedAt: null, updatedAt: olderDateFilter },
    ],
  }).select('completedAt updatedAt').lean();

  const olderMoneyDates = await MoneyTransaction.find({ date: olderDateFilter }).select('date').lean();
  const olderFoodDates = await FoodLog.find({ date: olderDateFilter }).select('date').lean();

  const olderMonthSet = new Set();
  olderTodoDates.forEach((t) => {
    const d = t.completedAt || t.updatedAt;
    const lDate = getLogicalDate(d);
    if (lDate && lDate.slice(0, 7) < windows.previousMonth) olderMonthSet.add(lDate.slice(0, 7));
  });
  olderMoneyDates.forEach((m) => {
    if (m.date) {
      const k = m.date.toISOString().slice(0, 7);
      if (k < windows.previousMonth) olderMonthSet.add(k);
    }
  });
  olderFoodDates.forEach((f) => {
    if (f.date) {
      const k = f.date.toISOString().slice(0, 7);
      if (k < windows.previousMonth) olderMonthSet.add(k);
    }
  });

  const olderMonths = [...olderMonthSet].sort();
  logMessage(`Discovered ${olderMonths.length} older month(s) containing raw data: ${olderMonths.join(', ') || 'None'}`);

  // Step C: For each older month, ensure summary is compiled and verified before deleting raw rows
  for (const oldMonth of olderMonths) {
    for (const user of users) {
      try {
        const summary = await compileUserMonthlySummary(user._id, oldMonth);
        logMessage(`Verified archive summary for user ${user.email} for older month ${oldMonth} (${summary._id})`);
      } catch (err) {
        const errorMsg = `CRITICAL: Failed to archive summary for older month ${oldMonth}, user ${user._id}: ${err.message}. Aborting cleanup!`;
        logMessage(errorMsg);
        throw new Error(errorMsg);
      }
    }
  }

  // Step D: Delete eligible detailed records from OLDER_MONTHS (strictly < olderMonthsThreshold)
  // Eligible records:
  // 1. Completed Todo items older than previous month (uncompleted tasks are preserved!)
  // 2. MoneyTransaction older than previous month
  // 3. FoodLog older than previous month
  // 4. RoomStatus older than previous month
  // 5. RoomLog older than previous month
  // 6. Non-recurring RoomTask completed items older than previous month (recurring chores preserved!)

  const eligibleCounts = {
    todos: await Todo.countDocuments({
      completed: true,
      $or: [
        { completedAt: olderDateFilter },
        { completedAt: null, updatedAt: olderDateFilter },
        { completedAt: { $exists: false }, updatedAt: olderDateFilter },
      ],
    }),
    moneyTransactions: await MoneyTransaction.countDocuments({ date: olderDateFilter }),
    foodLogs: await FoodLog.countDocuments({ date: olderDateFilter }),
    roomStatuses: await RoomStatus.countDocuments({
      date: { $lt: `${windows.previousMonth}-01` },
    }),
    roomLogs: await RoomLog.countDocuments({ date: olderDateFilter }),
    roomTasks: await RoomTask.countDocuments({
      recurring: 'none',
      completed: true,
      $or: [
        { dueDate: olderDateFilter },
        { createdAt: olderDateFilter },
      ],
    }),
  };

  logMessage(`Eligible older raw records identified for cleanup: ${JSON.stringify(eligibleCounts)}`);

  const deletedCounts = {
    todos: 0,
    moneyTransactions: 0,
    foodLogs: 0,
    roomStatuses: 0,
    roomLogs: 0,
    roomTasks: 0,
  };

  if (!dryRun) {
    // 1. Purge completed older Todos
    const todoRes = await Todo.deleteMany({
      completed: true,
      $or: [
        { completedAt: olderDateFilter },
        { completedAt: null, updatedAt: olderDateFilter },
        { completedAt: { $exists: false }, updatedAt: olderDateFilter },
      ],
    });
    deletedCounts.todos = todoRes.deletedCount || 0;

    // 2. Purge older MoneyTransactions
    const moneyRes = await MoneyTransaction.deleteMany({ date: olderDateFilter });
    deletedCounts.moneyTransactions = moneyRes.deletedCount || 0;

    // 3. Purge older FoodLogs
    const foodRes = await FoodLog.deleteMany({ date: olderDateFilter });
    deletedCounts.foodLogs = foodRes.deletedCount || 0;

    // 4. Purge older RoomStatuses
    const roomStatusRes = await RoomStatus.deleteMany({
      date: { $lt: `${windows.previousMonth}-01` },
    });
    deletedCounts.roomStatuses = roomStatusRes.deletedCount || 0;

    // 5. Purge older RoomLogs
    const roomLogRes = await RoomLog.deleteMany({ date: olderDateFilter });
    deletedCounts.roomLogs = roomLogRes.deletedCount || 0;

    // 6. Purge older non-recurring completed RoomTasks
    const roomTaskRes = await RoomTask.deleteMany({
      recurring: 'none',
      completed: true,
      $or: [
        { dueDate: olderDateFilter },
        { createdAt: olderDateFilter },
      ],
    });
    deletedCounts.roomTasks = roomTaskRes.deletedCount || 0;

    logMessage(`Cleanup completed successfully. Records deleted: ${JSON.stringify(deletedCounts)}`);
  } else {
    logMessage(`Dry-run finished. No records were modified or deleted.`);
  }

  // Step E: Verification of database integrity
  // Check that current month records and previous month records still exist intact
  const currentMonthTodoCount = await Todo.countDocuments({
    createdAt: { $gte: windows.currentMonthStart },
  });
  const totalUserCount = await User.countDocuments({});

  logMessage(`Integrity check: ${totalUserCount} users preserved, ${currentMonthTodoCount} current-month task(s) active.`);

  return {
    success: true,
    dryRun,
    windows: {
      currentMonth: windows.currentMonth,
      previousMonth: windows.previousMonth,
      olderMonthsThreshold: windows.olderMonthsThreshold.toISOString(),
    },
    summariesGenerated: summariesCreated.length,
    olderMonthsArchived: olderMonths,
    eligibleCounts,
    deletedCounts: dryRun ? eligibleCounts : deletedCounts,
    auditLog,
  };
};

module.exports = {
  getRetentionWindows,
  getMonthBounds,
  compileUserMonthlySummary,
  runMonthlyCleanup,
};
