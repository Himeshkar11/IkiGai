const { runMonthlyCleanup, getRetentionWindows } = require('../services/dataRetentionService');

let jobTimer = null;
let lastExecutedMonth = null;

/**
 * Executes a retention check. If the system has transitioned into a new month
 * and has not yet executed cleanup for the previous month, it triggers cleanup.
 */
const checkAndExecuteRetention = async () => {
  try {
    const windows = getRetentionWindows();
    const currentMonth = windows.currentMonth;

    // Only run once per month turnover
    if (lastExecutedMonth === currentMonth) {
      return;
    }

    console.log(`[RetentionScheduler] Monthly turnover check: current=${currentMonth}, previous=${windows.previousMonth}`);
    const result = await runMonthlyCleanup({
      dryRun: false,
    });

    lastExecutedMonth = currentMonth;
    console.log(`[RetentionScheduler] Automated retention succeeded for ${windows.previousMonth}. Summaries: ${result.summariesGenerated}`);
  } catch (error) {
    console.error('[RetentionScheduler] Automated retention job encountered an error:', error.message);
  }
};

/**
 * Starts the background retention scheduler.
 * Runs check on startup (after a 15-second grace period) and every 12 hours thereafter.
 */
const startRetentionScheduler = () => {
  const isEnabled = process.env.ENABLE_MONTHLY_CLEANUP === 'true';

  if (!isEnabled) {
    console.log('[RetentionScheduler] Automated background cleanup is disabled (ENABLE_MONTHLY_CLEANUP != true). Run manually via "npm run cleanup".');
    return;
  }

  console.log('[RetentionScheduler] Automated background retention scheduler initialized.');

  // Delay initial check by 15 seconds to allow DB connection and server boot
  setTimeout(() => {
    checkAndExecuteRetention();
  }, 15000);

  // Check every 12 hours
  const INTERVAL_MS = 12 * 60 * 60 * 1000;
  jobTimer = setInterval(() => {
    checkAndExecuteRetention();
  }, INTERVAL_MS);
};

const stopRetentionScheduler = () => {
  if (jobTimer) {
    clearInterval(jobTimer);
    jobTimer = null;
    console.log('[RetentionScheduler] Scheduler stopped.');
  }
};

module.exports = {
  startRetentionScheduler,
  stopRetentionScheduler,
  checkAndExecuteRetention,
};
