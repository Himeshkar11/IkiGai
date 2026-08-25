const getHealthStatus = async () => {
  return {
    status: 'OK',
    message: 'IkiGai API is running',
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  getHealthStatus,
}; 