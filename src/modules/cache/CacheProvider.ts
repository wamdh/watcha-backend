export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  provider: 'memory' | 'redis';
}

export interface CacheProvider {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  clear(): Promise<void>;
  getStats(): Promise<CacheStats>;
}
