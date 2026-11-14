import pino from 'pino';
import { env } from '../config/index.js';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'development' ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'headers.authorization',
      'token',
      'TMDB_READ_ACCESS_TOKEN',
      'password',
      'secret',
    ],
    remove: true,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
