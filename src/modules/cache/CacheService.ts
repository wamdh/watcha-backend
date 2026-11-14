import { CacheProvider, CacheStats } from './CacheProvider.js';
import { InMemoryCacheProvider } from './InMemoryCacheProvider.js';
import { RedisCacheProvider } from './RedisCacheProvider.js';
import { RequestDeduplicator } from './RequestDeduplicator.js';
import { env } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

export class CacheService {
  private provider: CacheProvider;
  private deduplicator: RequestDeduplicator;

  constructor() {
    this.deduplicator = new RequestDeduplicator();
    if (env.REDIS_URL && env.REDIS_URL.trim().length > 0) {
      this.provider = new RedisCacheProvider(env.REDIS_URL.trim());
    } else {
      this.provider = new InMemoryCacheProvider(10000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.provider.get<T>(key);
    } catch (err: any) {
      logger.warn({ key, err: err.message }, 'Cache read failed');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.provider.set<T>(key, value, ttlSeconds);
    } catch (err: any) {
      logger.warn({ key, err: err.message }, 'Cache write failed');
    }
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<{ data: T; cached: boolean }> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return { data: cached, cached: true };
    }

    // Deduplicate concurrent upstream fetches
    const fresh = await this.deduplicator.execute(key, fetchFn);
    // Asynchronously save to cache
    this.set(key, fresh, ttlSeconds).catch(() => {});
    return { data: fresh, cached: false };
  }

  async del(key: string): Promise<void> {
    await this.provider.del(key);
  }

  async clear(): Promise<void> {
    await this.provider.clear();
  }

  async getStats(): Promise<CacheStats> {
    return this.provider.getStats();
  }
}

export const defaultCacheService = new CacheService();
