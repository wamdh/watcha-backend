import { tmdbFetch } from '../tmdb/tmdbClient.js';
import { TMDB_ENDPOINTS } from '../tmdb/tmdbEndpoints.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { CACHE_TTL } from '../../config/index.js';
import { MediaType } from '../../shared/types.js';

interface ExternalIdsRaw {
  id: number;
  imdb_id: string | null;
  wikidata_id?: string | null;
}

export class ExternalIdService {
  static isValidImdbId(id?: string | null): boolean {
    if (!id) return false;
    return /^tt\d+$|^ev\d+$/i.test(id.trim());
  }

  static async getImdbId(mediaType: MediaType, tmdbId: number | string): Promise<string | null> {
    const cleanId = String(tmdbId).replace(/^(movie_|tv_)/, '');
    const cacheKey = `external_ids:${mediaType}:${cleanId}`;

    const { data } = await defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.EXTERNAL_IDS_SECONDS,
      async () => {
        const endpoint =
          mediaType === 'movie'
            ? TMDB_ENDPOINTS.movieExternalIds(cleanId)
            : TMDB_ENDPOINTS.tvExternalIds(cleanId);

        try {
          const res = await tmdbFetch<ExternalIdsRaw>(endpoint);
          if (res?.imdb_id && this.isValidImdbId(res.imdb_id)) {
            return res.imdb_id.trim();
          }
          return null;
        } catch {
          return null;
        }
      }
    );

    return data;
  }
}
