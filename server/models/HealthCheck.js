const mongoose = require('mongoose');

const healthCheckSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      default: 'ok',
    },
    checkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('HealthCheck', healthCheckSchema);
