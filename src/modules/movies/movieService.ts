import { tmdbFetch } from '../tmdb/tmdbClient.js';
import { TMDB_ENDPOINTS } from '../tmdb/tmdbEndpoints.js';
import { transformMovieDetails } from '../tmdb/tmdbTransformers.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { CACHE_TTL } from '../../config/index.js';
import { MovieDetails } from '../../shared/types.js';

export class MovieService {
  static async getMovieDetails(id: number | string): Promise<{ data: MovieDetails; cached: boolean }> {
    const cleanId = String(id).replace(/^movie_/, '');
    const cacheKey = `movie:details:${cleanId}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.MOVIE_DETAILS_SECONDS,
      async () => {
        const raw = await tmdbFetch<any>(TMDB_ENDPOINTS.movieDetails(cleanId), {
          params: {
            append_to_response: 'credits,videos,similar,recommendations',
          },
        });
        return transformMovieDetails(raw);
      }
    );
  }
}
