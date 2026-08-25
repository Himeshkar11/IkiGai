const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(error.errors).map(err => err.message);
  }
  // Mongoose duplicate key error
  else if (error.code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
    const field = Object.keys(error.keyPattern)[0];
    details = `${field} already exists`;
  }
  // Mongoose cast error
  else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }
  // JWT errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Custom error with statusCode
  else if (error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Generic error
  else {
    message = error.message || 'Internal Server Error';
  }

  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  };

  res.status(statusCode).json(response);
};

module.exports = { errorHandler };
