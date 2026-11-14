import { createApp } from './app.js';
import { env } from './config/index.js';
import { logger } from './utils/logger.js';
import { defaultCacheService } from './modules/cache/CacheService.js';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    {
      port: env.PORT,
      host: env.HOST,
      env: env.NODE_ENV,
      tmdbConfigured: Boolean(env.TMDB_READ_ACCESS_TOKEN),
    },
    `🚀 WATCHA Backend Server running at http://${env.HOST}:${env.PORT}`
  );
});

// Graceful shutdown handling
let isShuttingDown = false;

async function handleShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Graceful shutdown initiated');

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await defaultCacheService.clear();
      logger.info('Cache cleared');
    } catch (e: any) {
      logger.warn({ err: e.message }, 'Error clearing cache on shutdown');
    }
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Force shutdown after timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
