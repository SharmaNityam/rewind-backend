import winston from 'winston';
import path from 'path';

const logDir = 'logs';

// Custom format to properly serialize objects
const serializeObject = (obj: any, depth: number = 0): string => {
  if (depth > 10) return '[Max Depth]';
  
  if (obj === null || obj === undefined) {
    return '';
  }
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }
  
  if (obj instanceof Error) {
    return JSON.stringify({
      message: obj.message,
      stack: obj.stack,
      name: obj.name,
      ...(obj as any).code && { code: (obj as any).code },
    }, null, 2);
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => serializeObject(item, depth + 1)).join(', ') + ']';
  }
  
  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      
      // Handle Error objects
      if (value instanceof Error) {
        return {
          message: value.message,
          stack: value.stack,
          name: value.name,
        };
      }
      
      // Handle Date objects
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      return value;
    }, 2);
  } catch (error) {
    return `[Object: ${obj.constructor?.name || 'Unknown'}]`;
  }
};

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    // Custom format to handle objects properly
    winston.format((info) => {
      // If message is an object and no message string exists, convert it
      if (typeof info.message === 'object' && info.message !== null && !(info.message instanceof Error)) {
        const obj = info.message;
        // Extract message if it exists in the object, otherwise use empty string
        const extractedMessage = (obj as any).message || (obj as any).msg || '';
        info.message = extractedMessage;
        
        // Merge all other object properties into meta (excluding winston internals)
        Object.keys(obj).forEach(key => {
          if (!['message', 'msg', 'level', 'timestamp', 'service'].includes(key)) {
            info[key] = (obj as any)[key];
          }
        });
      }
      // Handle Error objects in message
      if (info.message instanceof Error) {
        const err = info.message;
        info.message = err.message;
        if (!info.error) {
          info.error = {
            name: err.name,
            message: err.message,
            stack: err.stack,
          };
        }
      }
      return info;
    })(),
    winston.format.json()
  ),
  defaultMeta: { service: 'rewind-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const messageStr = message || '';
          
          // Filter out winston internal fields
          const filteredMeta: any = {};
          Object.keys(meta).forEach(key => {
            if (!['splat', 'Symbol(level)', 'Symbol(message)'].includes(key)) {
              filteredMeta[key] = meta[key];
            }
          });
          
          const metaStr = Object.keys(filteredMeta).length > 0 
            ? '\n' + serializeObject(filteredMeta)
            : '';
          
          return `${timestamp} [${level}]: ${messageStr}${metaStr}`;
        })
      ),
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
});

export { logger };

