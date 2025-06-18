const winston = require('winston');
const { format } = winston;
const { combine, timestamp, printf, colorize } = format;

// Create a custom format
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), customFormat),
    })
  );
}

const loggingMiddleware = (req, res, next) => {
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  const originalSend = res.send;
  res.send = function (body) {
    logger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime,
    });
    return originalSend.call(this, body);
  };

  // Log errors
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.error('Request failed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: Date.now() - req._startTime,
      });
    }
  });

  // Add start time to request
  req._startTime = Date.now();

  next();
};

// Error logging middleware
const errorLoggingMiddleware = (err, req, res, next) => {
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next(err);
};

// Performance logging middleware
const performanceLoggingMiddleware = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;

    logger.info('Request performance', {
      method: req.method,
      path: req.path,
      duration: `${duration.toFixed(2)}ms`,
    });
  });

  next();
};

// Security logging middleware
const securityLoggingMiddleware = (req, res, next) => {
  // Log potential security issues
  if (req.headers['x-forwarded-for']) {
    logger.warn('Potential proxy detected', {
      ip: req.ip,
      forwardedFor: req.headers['x-forwarded-for'],
    });
  }

  if (req.headers['user-agent']?.includes('curl')) {
    logger.warn('Curl request detected', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  next();
};

module.exports = {
  logger,
  loggingMiddleware,
  errorLoggingMiddleware,
  performanceLoggingMiddleware,
  securityLoggingMiddleware,
}; 