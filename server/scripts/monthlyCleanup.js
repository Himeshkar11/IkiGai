#!/usr/bin/env node

/**
 * Monthly Data Retention & Cleanup CLI Tool
 *
 * Usage:
 *   node scripts/monthlyCleanup.js [--dry-run] [--month YYYY-MM]
 *
 * Description:
 *   1. Identifies CURRENT_MONTH, PREVIOUS_MONTH, and OLDER_MONTHS.
 *   2. Generates and verifies domain monthly summaries for all users.
 *   3. Verifies that summaries are persistently stored in MongoDB.
 *   4. Safely purges eligible detailed raw records from OLDER_MONTHS only.
 *   5. Preserves CURRENT_MONTH and PREVIOUS_MONTH operational data intact.
 *   6. Never deletes User records, Food master items, or recurring chores.
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../config/db');
const { runMonthlyCleanup } = require('../services/dataRetentionService');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  let targetMonth = null;

  const monthIdx = args.findIndex((arg) => arg === '--month' || arg === '-m');
  if (monthIdx !== -1 && args[monthIdx + 1]) {
    targetMonth = args[monthIdx + 1];
    if (!/^\d{4}-\d{2}$/.test(targetMonth)) {
      console.error(`Invalid month format "${targetMonth}". Expected YYYY-MM.`);
      process.exit(1);
    }
  }

  return { dryRun, targetMonth };
};

const main = async () => {
  const { dryRun, targetMonth } = parseArgs();

  console.log('='.repeat(60));
  console.log('  IkiGai Production Data Retention & Monthly Cleanup');
  console.log('='.repeat(60));
  console.log(`Execution Mode : ${dryRun ? 'DRY-RUN (audit only, no deletion)' : 'PRODUCTION CLEANUP (destructive)'}`);
  if (targetMonth) {
    console.log(`Target Month   : ${targetMonth}`);
  }
  console.log(`Timestamp      : ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Running monthly retention and aggregation pipeline...');
    const result = await runMonthlyCleanup({
      dryRun,
      targetMonth,
    });

    console.log('\n--- EXECUTION REPORT ---');
    console.log(`Status                 : ${result.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Current Month (Active) : ${result.windows.currentMonth}`);
    console.log(`Previous Month (Saved) : ${result.windows.previousMonth}`);
    console.log(`Older Months Threshold : ${result.windows.olderMonthsThreshold}`);
    console.log(`Summaries Generated    : ${result.summariesGenerated}`);
    console.log(`Older Months Archived  : ${result.olderMonthsArchived.join(', ') || 'None'}`);

    console.log('\nRecords Purged by Domain:');
    console.table({
      Todos: { Count: result.deletedCounts.todos },
      Finances: { Count: result.deletedCounts.moneyTransactions },
      Nutrition: { Count: result.deletedCounts.foodLogs },
      'Room Status': { Count: result.deletedCounts.roomStatuses },
      'Room Logs': { Count: result.deletedCounts.roomLogs },
      'Room Non-Recurring': { Count: result.deletedCounts.roomTasks },
    });

    console.log('\nAudit Trail:');
    result.auditLog.forEach((entry) => console.log(`  ${entry}`));

    console.log('\nProcess finished successfully.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n[FATAL ERROR] Retention job failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
};

main();
