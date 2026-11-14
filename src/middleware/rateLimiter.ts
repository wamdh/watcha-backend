import rateLimit from 'express-rate-limit';
import { env } from '../config/index.js';
import { sendError } from '../shared/response.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const reqId = req.id ? String(req.id) : undefined;
    sendError(
      res,
      429,
      'RATE_LIMIT_EXCEEDED',
      'تم تجاوز الحد المسموح به من الطلبات مؤقتاً. يرجى الانتظار قليلاً.',
      reqId
    );
  },
});
