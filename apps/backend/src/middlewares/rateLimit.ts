import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

/** Auth routes: stricter in production, relaxed in development */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  message: {
    status: 'fail',
    message: isDev
      ? 'Too many auth requests in development. Please wait a moment and try again.'
      : 'Too many auth attempts. Please try again later.',
  },
});

/** General API — effectively unlimited in development, capped in production */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => false,
  message: {
    status: 'fail',
    message: isDev
      ? 'Too many development requests. Please retry in a few seconds.'
      : 'Too many requests. Please try again later.',
  },
});
