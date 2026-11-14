import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { v1Router } from './routes/v1.js';
import { requestContextMiddleware } from './middleware/requestContext.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { env } from './config/index.js';
import { logger } from './utils/logger.js';

export function createApp(): Express {
  const app = express();

  // Trust proxy in production (Render runs behind reverse proxies)
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Mobile API does not serve HTML
    })
  );

  // CORS
  const allowedOrigins =
    env.ALLOWED_ORIGINS === '*'
      ? '*'
      : env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // Structured request logging
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/api/v1/health' || req.url === '/health',
        },
      })
    );
  }

  // Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Request ID injection
  app.use(requestContextMiddleware);

  // Rate Limiting
  app.use('/api/', apiRateLimiter);

  // Root greeting endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'WATCHA Backend API',
      version: '1.0.0',
      status: 'running',
      healthCheck: '/api/v1/health',
    });
  });

  // Render health check aliases
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'watcha-backend' });
  });

  // Mount API V1
  app.use('/api/v1', v1Router);

  // 404 & Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
