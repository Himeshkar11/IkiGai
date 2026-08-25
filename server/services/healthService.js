const getHealthStatus = async () => ({
  status: 'ok',
  service: 'IkiGai API',
  timestamp: new Date().toISOString(),
});

module.exports = {
  getHealthStatus,
};
