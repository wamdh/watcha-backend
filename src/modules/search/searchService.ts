import { tmdbFetch } from '../tmdb/tmdbClient.js';
import { TMDB_ENDPOINTS } from '../tmdb/tmdbEndpoints.js';
import { transformMovieRaw, transformTVRaw } from '../tmdb/tmdbTransformers.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { CACHE_TTL } from '../../config/index.js';
import { MediaItem } from '../../shared/types.js';

export class SearchService {
  static async search(
    query: string,
    type: 'all' | 'movie' | 'tv' = 'all',
    page = 1
  ): Promise<{ data: MediaItem[]; cached: boolean }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { data: [], cached: false };
    }

    const cacheKey = `search:${type}:${encodeURIComponent(cleanQuery)}:${page}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.SEARCH_RESULTS_SECONDS,
      async () => {
        let endpoint: string = TMDB_ENDPOINTS.searchMulti;
        if (type === 'movie') endpoint = TMDB_ENDPOINTS.searchMovie;
        if (type === 'tv') endpoint = TMDB_ENDPOINTS.searchTV;

        const raw = await tmdbFetch<any>(endpoint, {
          params: { query: cleanQuery, page },
        });

        const items: MediaItem[] = [];
        for (const item of raw.results || []) {
          if (item.media_type === 'person') continue;
          if (item.media_type === 'tv' || type === 'tv') {
            items.push(transformTVRaw(item));
          } else {
            items.push(transformMovieRaw(item));
          }
        }

        return items;
      }
    );
  }
}
