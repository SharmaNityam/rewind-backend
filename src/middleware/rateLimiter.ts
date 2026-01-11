import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

// In development, use much higher limits or skip for localhost
const isDevelopment = process.env.NODE_ENV === 'development';
const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';

export const generalRateLimiter = rateLimit({
  windowMs,
  max: disableRateLimit ? 999999 : (isDevelopment ? 50000 : maxRequests), // Disable or 50,000 requests in dev, 100 in production
  skip: (req) => {
    // Skip rate limiting if disabled or for localhost in development
    if (disableRateLimit) return true;
    if (isDevelopment) {
      const ip = req.ip || req.socket.remoteAddress || '';
      // More lenient IP matching for development
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' 
        || ip.startsWith('127.0.0.1') || ip.startsWith('::1')
        || ip === 'localhost' || ip.includes('localhost')
        || !ip || ip === '::ffff:127.0.0.1';
    }
    return false;
  },
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: disableRateLimit ? 999999 : (isDevelopment ? 10000 : 5), // Disable or 10,000 requests in dev, 5 in production
  skip: (req) => {
    // Skip rate limiting if disabled or for localhost in development
    if (disableRateLimit) return true;
    if (isDevelopment) {
      const ip = req.ip || req.socket.remoteAddress || '';
      // More lenient IP matching for development
      return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' 
        || ip.startsWith('127.0.0.1') || ip.startsWith('::1')
        || ip === 'localhost' || ip.includes('localhost')
        || !ip || ip === '::ffff:127.0.0.1';
    }
    return false;
  },
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

