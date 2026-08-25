const healthService = require('../services/healthService');

const getHealthStatus = async (req, res, next) => {
  try {
    const status = await healthService.getHealthStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus,
};
