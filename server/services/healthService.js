const getHealthStatus = async () => {
  return {
    status: 'ok',
    message: 'IkiGai API is healthy and operational',
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealthStatus,
};