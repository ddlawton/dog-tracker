const logger = require('../utils/logger');

// Error handling middleware
function errorHandler(err, req, res, next) {
  // Log the error with full details
  logger.error('Error occurred', {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.body,
      ip: req.ip,
      requestId: req.id
    }
  });

  // Validation errors (from Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      requestId: req.id
    });
  }

  // Database errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL constraint violations (23xxx codes)
    return res.status(400).json({
      error: 'Database constraint violation',
      message: 'The operation violates a database constraint',
      requestId: req.id
    });
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Database connection failed. Please try again later.',
      requestId: req.id
    });
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    requestId: req.id,
    ...(isDevelopment && { stack: err.stack }) // Include stack trace in development
  });
}

// Async error wrapper - wraps async route handlers to catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Not found handler
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    requestId: req.id
  });
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler
};
