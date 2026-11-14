import { tmdbFetch } from '../tmdb/tmdbClient.js';
import { TMDB_ENDPOINTS } from '../tmdb/tmdbEndpoints.js';
import { transformTVDetails, transformSeasonDetails } from '../tmdb/tmdbTransformers.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { CACHE_TTL } from '../../config/index.js';
import { SeriesDetails, SeasonDetails } from '../../shared/types.js';

export class SeriesService {
  static async getSeriesDetails(id: number | string): Promise<{ data: SeriesDetails; cached: boolean }> {
    const cleanId = String(id).replace(/^tv_/, '');
    const cacheKey = `series:details:${cleanId}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.SERIES_DETAILS_SECONDS,
      async () => {
        const raw = await tmdbFetch<any>(TMDB_ENDPOINTS.tvDetails(cleanId), {
          params: {
            append_to_response: 'credits,videos,similar,recommendations',
          },
        });
        return transformTVDetails(raw);
      }
    );
  }

  static async getSeasonDetails(
    id: number | string,
    seasonNumber: number
  ): Promise<{ data: SeasonDetails; cached: boolean }> {
    const cleanId = String(id).replace(/^tv_/, '');
    const cacheKey = `series:season:${cleanId}:${seasonNumber}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.SEASON_DETAILS_SECONDS,
      async () => {
        const raw = await tmdbFetch<any>(TMDB_ENDPOINTS.seasonDetails(cleanId, seasonNumber));
        return transformSeasonDetails(raw);
      }
    );
  }
}
