import { CacheProvider, CacheStats } from './CacheProvider.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCacheProvider implements CacheProvider {
  public readonly name = 'memory';
  private store = new Map<string, CacheEntry<any>>();
  private hits = 0;
  private misses = 0;
  private readonly maxEntries: number;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest 10%
      const keysToEvict = Array.from(this.store.keys()).slice(0, Math.floor(this.maxEntries * 0.1));
      for (const k of keysToEvict) {
        this.store.delete(k);
      }
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getStats(): Promise<CacheStats> {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      provider: 'memory',
    };
  }
}
