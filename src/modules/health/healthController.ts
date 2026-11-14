import { Request, Response } from 'express';
import { sendSuccess } from '../../shared/response.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { env } from '../../config/index.js';

export class HealthController {
  static getHealth(req: Request, res: Response): void {
    const reqId = req.id ? String(req.id) : undefined;
    sendSuccess(
      res,
      {
        status: 'ok',
        service: 'watcha-backend',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
      },
      { requestId: reqId }
    );
  }

  static async getReadiness(req: Request, res: Response): Promise<void> {
    const reqId = req.id ? String(req.id) : undefined;
    const cacheStats = await defaultCacheService.getStats();
    const hasTmdbToken = Boolean(env.TMDB_READ_ACCESS_TOKEN && env.TMDB_READ_ACCESS_TOKEN.trim().length > 0);

    const isReady = hasTmdbToken;

    sendSuccess(
      res,
      {
        status: isReady ? 'ready' : 'degraded',
        service: 'watcha-backend',
        version: '1.0.0',
        uptimeSeconds: Math.floor(process.uptime()),
        dependencies: {
          tmdbConfigured: hasTmdbToken,
          cache: {
            provider: cacheStats.provider,
            itemsCount: cacheStats.size,
            hits: cacheStats.hits,
            misses: cacheStats.misses,
          },
        },
        memoryUsage: process.memoryUsage(),
      },
      { requestId: reqId },
      isReady ? 200 : 503
    );
  }
}
