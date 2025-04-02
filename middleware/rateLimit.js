import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000,
  max: process.env.RATE_LIMIT_MAX,
  message: {
    error: 'Too many requests, please try again later'
  }
});
