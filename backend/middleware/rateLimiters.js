import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

const isDev = config.env === 'development';
const authApiPrefix = `/api/${config.apiVersion}/auth`;

export const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isDev ? 10000 : config.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path.startsWith(authApiPrefix),
});

export const authLimiter = rateLimit({
  windowMs: config.authRateLimit.windowMs,
  max: isDev ? 100 : config.authRateLimit.max,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
