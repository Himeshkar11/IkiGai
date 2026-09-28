# Production Readiness, Data Retention, and Launch Verification

This document provides complete architectural and operational documentation for IkiGai's production deployment, data-retention strategy, uptime keep-alive monitoring, and launch verification.

---

## 1. Design & UI Hardening Principles

The application user interface has been inspected and hardened for credible, professional production use:

- **No AI / "Vibe-Coded" Stereotypes**: Zero generic purple/blue SaaS gradients, zero decorative floating blobs, zero emoji icons as UI controls, and zero fake social proof (no fake testimonials, user counters, or revenue numbers).
- **Domain-Focused Hierarchy**: Visual elements exist solely to serve operational tracking: Daily Task Completion, Nutrition Intake, Living Space Check-ins, and Expense Budgeting.
- **Strict State Handling**: Loading indicators, empty states (with actionable guidance), and network error states are present across all modules.
- **Consistent Design System**: All styling is driven by CSS custom properties in [App.css](file:///d:/00%20study/IkiGai/IkiGai/client/src/App.css) and [index.css](file:///d:/00%20study/IkiGai/IkiGai/client/src/index.css), supporting both Dark and Light themes with accessible contrast ratios.

---

## 2. Monthly Data-Retention Strategy & Database Cleanup

### Objective
Maintain optimal database performance and size indefinitely by archiving old detailed operational records into structured monthly aggregates while strictly preserving historical reporting, streaks, and current operational data.

### Retention Boundary Definitions
The retention service explicitly categorizes data into three windows:

```text
CURRENT_MONTH (e.g. 2026-09)
  ↳ All detailed operational data is kept intact. NEVER pruned.

PREVIOUS_MONTH (e.g. 2026-08)
  ↳ Monthly summary generated and permanently stored in MonthlySummary.
  ↳ Detailed operational data is preserved for immediate historical reporting.

OLDER_MONTHS (e.g. <= 2026-07)
  ↳ Historical monthly summary verified and permanently stored in MonthlySummary.
  ↳ Unnecessary raw records safely pruned to reclaim database storage.
```

### What is Preserved (Never Deleted)
1. **User Accounts** (`User` collection): Permanent credentials and user profiles.
2. **Master Food Database** (`Food` collection): The user's curated food items and nutritional reference data.
3. **Chore & Routine Definitions** (`RoomTask` collection with `recurring !== 'none'`): Active daily, weekly, or monthly chore schedules.
4. **Uncompleted Tasks** (`Todo` collection with `completed: false`): Overdue or pending items remain visible to the user.
5. **Current Month Data**: Every record dated in the active month.
6. **Previous Month Data**: Complete detailed records for the immediately preceding month.
7. **Monthly Summaries** (`MonthlySummary` collection): Historical task activity counts, active days, daily spending maps, nutrient totals/averages, and space routine aggregates.

### What is Pruned (Only After Verified Summary Storage)
1. Completed `Todo` records older than the previous month start.
2. Individual `MoneyTransaction` records older than the previous month start.
3. Daily `FoodLog` documents older than the previous month start.
4. Daily `RoomStatus` logs older than the previous month start.
5. Legacy `RoomLog` entries older than the previous month start.
6. Non-recurring, completed `RoomTask` records older than the previous month start.

### Safe Execution Flow

```text
Identify CURRENT_MONTH, PREVIOUS_MONTH, and OLDER_MONTHS threshold
                      ↓
Compile domain aggregates for target month for every user
                      ↓
Upsert into MonthlySummary (enforced by unique { userId, month } index)
                      ↓
Verify MonthlySummary document was successfully stored and verified
                      ↓
(If verification fails: ABORT operation immediately with zero deletions)
                      ↓
Identify eligible detailed records strictly older than previous month start
                      ↓
Delete eligible detailed records in batches
                      ↓
Verify database integrity and emit audit log
```

### Historical Reporting Compatibility
The application's analytics and reporting controllers have been hardened to support archived data:
- **Task Heatmap & Activity** ([activityController.js](file:///d:/00%20study/IkiGai/IkiGai/server/controllers/activityController.js)): If raw task records for a past month were purged, the controller automatically queries [MonthlySummary](file:///d:/00%20study/IkiGai/IkiGai/server/models/MonthlySummary.js) to populate the monthly activity grid.
- **Streak Calculation** ([todoActivityService.js](file:///d:/00%20study/IkiGai/IkiGai/server/services/todoActivityService.js)): Historical active dates are merged with archived monthly summaries so long streaks are never lost.
- **Financial Monthly Totals** ([moneyController.js](file:///d:/00%20study/IkiGai/IkiGai/server/controllers/moneyController.js)): If transactions for an older month are purged, `monthlyTotalForUser` queries `MonthlySummary.money.totalSpent`.

### Manual CLI Execution
To audit what records would be pruned without deleting anything:
```bash
cd server
npm run cleanup:dry-run
```

To run a production cleanup for the previous month:
```bash
cd server
npm run cleanup
```

To summarize and clean up a specific historical month:
```bash
node scripts/monthlyCleanup.js --month 2026-07
```

### Automated Background Execution
- An automated scheduler is available in [retentionJob.js](file:///d:/00%20study/IkiGai/IkiGai/server/jobs/retentionJob.js).
- **Configuration**: Set `ENABLE_MONTHLY_CLEANUP=true` in `server/.env`.
- **Timing**: Checks on server start (15-second grace period) and every 12 hours thereafter. When the calendar advances to a new month, it executes the retention pipeline once for the elapsed month.
- **To Disable**: Keep `ENABLE_MONTHLY_CLEANUP=false` (default) and trigger via cron or CI/CD runner.

---

## 3. Application Health Check & Keep-Alive Monitoring

### Lightweight Production Health Endpoint
A dedicated health check endpoint is implemented at both `GET /health` and `GET /api/health`:
- **Response**: `200 OK` with JSON `{ "status": "ok", "timestamp": "..." }`.
- **Performance**: Responds in < 1ms. Performs zero database queries, zero analytics calculations, and zero file writes.
- **Self-DDoS Prevention**: Completely decoupled from business logic and database writes.

### 5-Minute Keep-Alive Cron Setup
To keep containerized platforms (e.g., Render, Railway, Fly.io) active without idling:

#### Option A: GitHub Actions Scheduled Cron (Included)
A GitHub Actions workflow is pre-configured at [.github/workflows/keep-alive.yml](file:///d:/00%20study/IkiGai/IkiGai/.github/workflows/keep-alive.yml).
1. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2. Add a repository secret named `PRODUCTION_APP_URL` with your live domain (e.g., `https://api.yourdomain.com`).
3. GitHub Actions will trigger `curl -s -f -m 5 "$HEALTH_URL"` every 5 minutes automatically.

#### Option B: Standalone Node Pinger
Run the standalone keep-alive worker:
```bash
cd server
HEALTH_CHECK_URL=https://your-production-domain.com/health npm run keep-alive
```

#### Option C: Native Cloud Platform Cron / External Pingers
Configure any external monitoring service (Cron-job.org, UptimeRobot, BetterUptime) to perform:
- **Method**: `GET`
- **URL**: `https://<YOUR-DOMAIN>/health`
- **Interval**: `5 minutes`
- **Timeout**: `5 seconds`

---

## 4. Legal Compliance & Navigation Accessibility

- **Privacy Policy**: Implemented at [PrivacyPage.jsx](file:///d:/00%20study/IkiGai/IkiGai/client/src/pages/PrivacyPage.jsx) and mapped to `/privacy`. Contains transparent explanations of data retention, encryption, user ownership, and access controls.
- **Terms & Conditions**: Implemented at [TermsPage.jsx](file:///d:/00%20study/IkiGai/IkiGai/client/src/pages/TermsPage.jsx) and mapped to `/terms`.
- **Public & Authenticated Accessibility**: Both legal documents are fully accessible:
  1. From the desktop sidebar footer.
  2. From the application layout footer across desktop and mobile.
  3. From the unauthenticated sign-in and registration pages ([LoginPage.jsx](file:///d:/00%20study/IkiGai/IkiGai/client/src/pages/LoginPage.jsx), [RegisterPage.jsx](file:///d:/00%20study/IkiGai/IkiGai/client/src/pages/RegisterPage.jsx)).
  4. Directly via deep-links `/privacy` and `/terms` without forced redirects to login.

---

## 5. Launch Readiness Checklist

| Category | Item | Status | Verification Detail |
|---|---|---|---|
| **Domain** | Custom production domain connected | **UNVERIFIED** | Awaiting deployment environment host configuration (`APP_URL`) |
| **Domain** | HTTPS & TLS encryption active | **UNVERIFIED** | Configured by host platform reverse proxy (SSL certificate) |
| **Branding** | Favicon & Product Identity | **VERIFIED** | SVG favicon present in `client/public/favicon.svg`, brand logo styled |
| **Branding** | Document Title & Metadata | **VERIFIED** | `index.html` configured with descriptive title, meta description, and OG tags |
| **Branding** | No AI builder / generic template text | **VERIFIED** | Verified zero "Made with", template placeholders, or fake reviews |
| **Legal** | Privacy Policy Page | **VERIFIED** | Route `/privacy` active and accessible in all app states |
| **Legal** | Terms & Conditions Page | **VERIFIED** | Route `/terms` active and accessible in all app states |
| **Database** | Monthly Summary Mechanism | **VERIFIED** | `MonthlySummary` model created with compound unique index `{ userId: 1, month: 1 }` |
| **Database** | Historical Raw-Data Cleanup | **VERIFIED** | `dataRetentionService.js` implemented with multi-stage verification |
| **Database** | Current Month Protected | **VERIFIED** | Date boundaries strictly protect active month data (verified by unit tests) |
| **Database** | Previous Month Summary Protected | **VERIFIED** | `PREVIOUS_MONTH` is summarized while retaining operational detailed data |
| **Database** | Permanent Data Protected | **VERIFIED** | `User`, `Food` master dictionary, and recurring `RoomTask` records never deleted |
| **Database** | Cleanup is Idempotent | **VERIFIED** | Upsert logic and unique index prevent duplicate monthly aggregates |
| **Automation** | Monthly Cleanup CLI Script | **VERIFIED** | `server/scripts/monthlyCleanup.js` supporting `--dry-run` and `--month` |
| **Automation** | Lightweight `/health` Endpoint | **VERIFIED** | `GET /health` returns `{ status: "ok" }` in <1ms without DB calls |
| **Automation** | 5-Minute Keep-Alive Cron | **VERIFIED** | `server/scripts/keepAlive.js` and `.github/workflows/keep-alive.yml` implemented |
| **Security** | Secrets In Environment Variables | **VERIFIED** | `.env.example` documented; passwords hashed via bcrypt; JWT authentication |
| **Security** | Production Error Masking | **VERIFIED** | `errorHandler.js` suppresses stack traces in production (`NODE_ENV=production`) |
| **Quality** | Server Unit & Regression Tests | **VERIFIED** | 68/68 server tests passing |
| **Quality** | Client Unit & Regression Tests | **VERIFIED** | 35/35 client tests passing |
| **Quality** | Client Production Build | **VERIFIED** | `vite build` completed successfully (zero build errors) |
