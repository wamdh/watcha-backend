import { Redis } from 'ioredis';
import { CacheProvider, CacheStats } from './CacheProvider.js';
import { InMemoryCacheProvider } from './InMemoryCacheProvider.js';
import { logger } from '../../utils/logger.js';

export class RedisCacheProvider implements CacheProvider {
  public readonly name = 'redis';
  private redis: Redis | null = null;
  private fallbackMemory: InMemoryCacheProvider;
  private isConnected = false;
  private hits = 0;
  private misses = 0;

  constructor(redisUrl: string) {
    this.fallbackMemory = new InMemoryCacheProvider();
    try {
      this.redis = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 4000,
      });

      this.redis.connect()
        .then(() => {
          this.isConnected = true;
          logger.info('Connected to Redis cache successfully');
        })
        .catch((err) => {
          logger.warn({ err: err.message }, 'Redis connection failed. Falling back to in-memory cache');
          this.isConnected = false;
        });

      this.redis.on('error', (err) => {
        logger.warn({ err: err.message }, 'Redis error encountered. Using in-memory fallback');
        this.isConnected = false;
      });
    } catch (err: any) {
      logger.warn({ err: err.message }, 'Could not initialize Redis. Using in-memory cache');
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      return this.fallbackMemory.get<T>(key);
    }

    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.misses++;
        return null;
      }
      this.hits++;
      return JSON.parse(data) as T;
    } catch {
      return this.fallbackMemory.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return this.fallbackMemory.set<T>(key, value, ttlSeconds);
    }

    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      await this.fallbackMemory.set<T>(key, value, ttlSeconds);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) {
      return this.fallbackMemory.del(key);
    }
    try {
      await this.redis.del(key);
    } catch {
      await this.fallbackMemory.del(key);
    }
  }

  async clear(): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.flushdb();
      } catch {
        // ignore
      }
    }
    await this.fallbackMemory.clear();
  }

  async getStats(): Promise<CacheStats> {
    if (!this.isConnected) {
      const memStats = await this.fallbackMemory.getStats();
      return { ...memStats, provider: 'memory' };
    }

    return {
      hits: this.hits,
      misses: this.misses,
      size: 0,
      provider: 'redis',
    };
  }
}
