import { describe, it, expect } from 'vitest';
import { InMemoryCacheProvider } from '../src/modules/cache/InMemoryCacheProvider.js';
import { RequestDeduplicator } from '../src/modules/cache/RequestDeduplicator.js';

describe('Caching and Deduplication', () => {
  it('stores and retrieves cached values within TTL', async () => {
    const cache = new InMemoryCacheProvider();
    await cache.set('test_key', { hello: 'world' }, 10);

    const val = await cache.get<{ hello: string }>('test_key');
    expect(val).toEqual({ hello: 'world' });

    const stats = await cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
  });

  it('expires entries after TTL', async () => {
    const cache = new InMemoryCacheProvider();
    await cache.set('expiring_key', 'data', -1); // already expired

    const val = await cache.get('expiring_key');
    expect(val).toBeNull();

    const stats = await cache.getStats();
    expect(stats.misses).toBe(1);
  });

  it('RequestDeduplicator coalesces concurrent identical requests', async () => {
    const deduplicator = new RequestDeduplicator();
    let callCount = 0;

    const slowOperation = async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'shared-result';
    };

    const [res1, res2, res3] = await Promise.all([
      deduplicator.execute('dedup_key', slowOperation),
      deduplicator.execute('dedup_key', slowOperation),
      deduplicator.execute('dedup_key', slowOperation),
    ]);

    expect(res1).toBe('shared-result');
    expect(res2).toBe('shared-result');
    expect(res3).toBe('shared-result');
    expect(callCount).toBe(1); // exactly 1 upstream execution!
  });
});
