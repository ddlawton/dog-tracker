const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Add request ID and log all requests
function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Store request start time
  const startTime = Date.now();

  // Log incoming request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing response', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
