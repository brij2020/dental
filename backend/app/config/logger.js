const winston = require('winston');
const fs = require('fs');
const path = require('path');

const isProd = process.env.NODE_ENV === 'production';

// Ensure logs directory exists
// const logsDir = path.join(__dirname, '../../logs');
// if (!fs.existsSync(logsDir)) {
//   fs.mkdirSync(logsDir, { recursive: true });
// }

// Custom format for better visibility
const customFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaString}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    isProd
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize({ all: true }),
          customFormat
        )
  ),
  defaultMeta: { service: 'clinic-api' },
  transports: [
    // Console transport with colors in development
    new winston.transports.Console({
      format: isProd 
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize({ all: true }),
            customFormat
          )
    }),
    // // Error logs
    // new winston.transports.File({
    //   filename: path.join(logsDir, 'error.log'),
    //   level: 'error',
    //   format: winston.format.combine(
    //     winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    //     winston.format.errors({ stack: true }),
    //     winston.format.json()
    //   ),
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 10,
    // }),
    // // Combined logs
    // new winston.transports.File({
    //   filename: path.join(logsDir, 'combined.log'),
    //   format: winston.format.combine(
    //     winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    //     winston.format.errors({ stack: true }),
    //     isProd ? winston.format.json() : customFormat
    //   ),
    //   maxsize: 5242880, // 5MB
    //   maxFiles: 10,
    // })
  ],
});

// Express HTTP request logger middleware with enhanced details
const httpLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';
    
    logger[logLevel](`${req.method} ${req.originalUrl}`, {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
    });
  });

  // Log request errors
  res.on('error', (err) => {
    logger.error(`Error in ${req.method} ${req.originalUrl}`, {
      requestId,
      error: err.message,
      stack: err.stack,
      statusCode: res.statusCode,
    });
  });
  
  next();
};

module.exports = { logger, httpLogger };
