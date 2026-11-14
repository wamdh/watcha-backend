import { tmdbFetch } from '../tmdb/tmdbClient.js';
import { TMDB_ENDPOINTS } from '../tmdb/tmdbEndpoints.js';
import {
  transformMovieRaw,
  transformTVRaw,
} from '../tmdb/tmdbTransformers.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { CACHE_TTL } from '../../config/index.js';
import { MediaItem, HomeCatalog, MediaType } from '../../shared/types.js';

export class CatalogService {
  static async getHomeCatalog(): Promise<{ data: HomeCatalog; cached: boolean }> {
    const cacheKey = 'catalog:home';

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.HOME_CATALOG_SECONDS,
      async () => {
        const [
          trendingDayRaw,
          trendingWeekRaw,
          popularMoviesRaw,
          popularTVRaw,
          topRatedRaw,
          nowPlayingRaw,
          upcomingRaw,
          onTheAirRaw,
        ] = await Promise.all([
          tmdbFetch<any>(TMDB_ENDPOINTS.trendingAllDay, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.trendingAllWeek, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.popularMovies, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.popularTV, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.topRatedMovies, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.nowPlayingMovies, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.upcomingMovies, { params: { page: 1 } }).catch(() => ({ results: [] })),
          tmdbFetch<any>(TMDB_ENDPOINTS.onTheAirTV, { params: { page: 1 } }).catch(() => ({ results: [] })),
        ]);

        const mapTrending = (results: any[]) =>
          (results || []).map((item) => (item.media_type === 'tv' ? transformTVRaw(item) : transformMovieRaw(item)));

        const trendingDay = mapTrending(trendingDayRaw.results);
        const trendingWeek = mapTrending(trendingWeekRaw.results);
        const popularMovies = (popularMoviesRaw.results || []).map(transformMovieRaw);
        const popularTV = (popularTVRaw.results || []).map(transformTVRaw);
        const topRated = (topRatedRaw.results || []).map(transformMovieRaw);
        const nowPlaying = (nowPlayingRaw.results || []).map(transformMovieRaw);
        const upcoming = (upcomingRaw.results || []).map(transformMovieRaw);
        const onTheAir = (onTheAirRaw.results || []).map(transformTVRaw);

        const featured = trendingDay[0] || trendingWeek[0] || popularMovies[0] || null;

        const home: HomeCatalog = {
          featured,
          trendingDay,
          trendingWeek,
          popularMovies,
          popularTV,
          topRated,
          nowPlaying,
          upcoming,
          onTheAir,
        };

        return home;
      }
    );
  }

  static async getTrending(
    type: 'all' | 'movie' | 'tv' = 'all',
    timeWindow: 'day' | 'week' = 'day',
    page = 1
  ): Promise<{ data: MediaItem[]; cached: boolean }> {
    const cacheKey = `catalog:trending:${type}:${timeWindow}:${page}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.TRENDING_SECONDS,
      async () => {
        let endpoint: string = TMDB_ENDPOINTS.trendingAllDay;
        if (type === 'movie') {
          endpoint = timeWindow === 'week' ? TMDB_ENDPOINTS.trendingMovieWeek : TMDB_ENDPOINTS.trendingMovieDay;
        } else if (type === 'tv') {
          endpoint = timeWindow === 'week' ? TMDB_ENDPOINTS.trendingTVWeek : TMDB_ENDPOINTS.trendingTVDay;
        } else {
          endpoint = timeWindow === 'week' ? TMDB_ENDPOINTS.trendingAllWeek : TMDB_ENDPOINTS.trendingAllDay;
        }

        const raw = await tmdbFetch<any>(endpoint, { params: { page } });
        return (raw.results || []).map((item: any) =>
          item.media_type === 'tv' || type === 'tv' ? transformTVRaw(item) : transformMovieRaw(item)
        );
      }
    );
  }

  static async getPopular(
    type: MediaType = 'movie',
    page = 1
  ): Promise<{ data: MediaItem[]; cached: boolean }> {
    const cacheKey = `catalog:popular:${type}:${page}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.POPULAR_SECONDS,
      async () => {
        const endpoint = type === 'movie' ? TMDB_ENDPOINTS.popularMovies : TMDB_ENDPOINTS.popularTV;
        const raw = await tmdbFetch<any>(endpoint, { params: { page } });
        return (raw.results || []).map(type === 'movie' ? transformMovieRaw : transformTVRaw);
      }
    );
  }

  static async getTopRated(
    type: MediaType = 'movie',
    page = 1
  ): Promise<{ data: MediaItem[]; cached: boolean }> {
    const cacheKey = `catalog:top_rated:${type}:${page}`;

    return defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.TOP_RATED_SECONDS,
      async () => {
        const endpoint = type === 'movie' ? TMDB_ENDPOINTS.topRatedMovies : TMDB_ENDPOINTS.topRatedTV;
        const raw = await tmdbFetch<any>(endpoint, { params: { page } });
        return (raw.results || []).map(type === 'movie' ? transformMovieRaw : transformTVRaw);
      }
    );
  }
}
