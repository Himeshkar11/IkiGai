const errorHandler = (error, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  });

  next();
};

module.exports = { errorHandler };
