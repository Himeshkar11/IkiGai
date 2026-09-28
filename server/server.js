const app = require('./app');
const { startRetentionScheduler } = require('./jobs/retentionJob');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startRetentionScheduler();
});

