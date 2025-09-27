import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport for development
  new winston.transports.Console({
    format,
  }),

  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
  }),

  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),

  // HTTP requests log
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'http.log'),
    level: 'http',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
});

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    });
  });

  next();
};

// Structured logging methods
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};

export const logInfo = (message: string, context?: any) => {
  logger.info(message, context);
};

export const logWarn = (message: string, context?: any) => {
  logger.warn(message, context);
};

export const logDebug = (message: string, context?: any) => {
  logger.debug(message, context);
};

// Performance logging
export const logPerformance = (operation: string, duration: number, context?: any) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...context,
  });
};

// Database operation logging
export const logDatabase = (operation: string, collection: string, duration?: number, context?: any) => {
  logger.debug(`Database: ${operation} on ${collection}`, {
    operation,
    collection,
    duration,
    ...context,
  });
};

// Authentication logging
export const logAuth = (action: string, userId?: string, success: boolean = true, context?: any) => {
  const level = success ? 'info' : 'warn';
  logger.log(level, `Auth: ${action}`, {
    action,
    userId,
    success,
    ...context,
  });
};

export default logger;
