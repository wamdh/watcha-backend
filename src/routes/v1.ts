import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { HealthController } from '../modules/health/healthController.js';
import { CatalogService } from '../modules/catalog/catalogService.js';
import { MovieService } from '../modules/movies/movieService.js';
import { SeriesService } from '../modules/series/seriesService.js';
import { SearchService } from '../modules/search/searchService.js';
import { SourceService } from '../modules/sources/sourceService.js';
import { sendSuccess } from '../shared/response.js';
import { ValidationError } from '../shared/errors.js';
import { MediaType } from '../shared/types.js';

export const v1Router = Router();

// Helper to get string requestId
function getReqId(req: Request): string | undefined {
  return req.id ? String(req.id) : undefined;
}

// 1. Health & Readiness
v1Router.get('/health', HealthController.getHealth);
v1Router.get('/health/ready', HealthController.getReadiness);

// 2. Application Config & Capabilities
v1Router.get('/app/config', (req: Request, res: Response) => {
  sendSuccess(
    res,
    {
      name: 'WATCHA',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production',
      features: {
        torrentStreaming: true,
        directStreaming: true,
        subtitles: true,
        audioTracks: true,
        arabicRtl: true,
      },
      cdn: {
        imageBaseUrl: 'https://image.tmdb.org/t/p',
      },
    },
    { requestId: getReqId(req) }
  );
});

// 3. Catalog - Aggregated Home
v1Router.get('/catalog/home', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, cached } = await CatalogService.getHomeCatalog();
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 4. Catalog - Trending
const trendingQuerySchema = z.object({
  type: z.enum(['all', 'movie', 'tv']).default('all'),
  timeWindow: z.enum(['day', 'week']).default('day'),
  page: z.string().transform((v) => parseInt(v, 10)).default('1'),
});

v1Router.get('/catalog/trending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = trendingQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('معايير استعلام المحتوى الرائج غير صالحة', parsed.error.format());
    }
    const { type, timeWindow, page } = parsed.data;
    const { data, cached } = await CatalogService.getTrending(type, timeWindow, page);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 5. Catalog - Popular
const catalogTypeSchema = z.object({
  type: z.enum(['movie', 'tv']).default('movie'),
  page: z.string().transform((v) => parseInt(v, 10)).default('1'),
});

v1Router.get('/catalog/popular', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = catalogTypeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('معايير استعلام المحتوى الشائع غير صالحة', parsed.error.format());
    }
    const { type, page } = parsed.data;
    const { data, cached } = await CatalogService.getPopular(type as MediaType, page);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 6. Catalog - Top Rated
v1Router.get('/catalog/top-rated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = catalogTypeSchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('معايير استعلام المحتوى الأعلى تقييماً غير صالحة', parsed.error.format());
    }
    const { type, page } = parsed.data;
    const { data, cached } = await CatalogService.getTopRated(type as MediaType, page);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 7. Movie Details
v1Router.get('/movies/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id || !/^(movie_)?\d+$/.test(id)) {
      throw new ValidationError('معرّف الفيلم غير صالح');
    }
    const { data, cached } = await MovieService.getMovieDetails(id);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 8. Series Details
v1Router.get('/series/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!id || !/^(tv_)?\d+$/.test(id)) {
      throw new ValidationError('معرّف المسلسل غير صالح');
    }
    const { data, cached } = await SeriesService.getSeriesDetails(id);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 9. Series Season Details
v1Router.get('/series/:id/seasons/:seasonNumber', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const seasonNumber = parseInt(String(req.params.seasonNumber), 10);
    if (!id || !/^(tv_)?\d+$/.test(id) || isNaN(seasonNumber) || seasonNumber < 0) {
      throw new ValidationError('معرّف المسلسل أو رقم الموسم غير صالح');
    }
    const { data, cached } = await SeriesService.getSeasonDetails(id, seasonNumber);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 10. Search
const searchQuerySchema = z.object({
  q: z.string().min(1, 'نص البحث لا يمكن أن يكون فارغاً'),
  type: z.enum(['all', 'movie', 'tv']).default('all'),
  page: z.string().transform((v) => parseInt(v, 10)).default('1'),
});

v1Router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError('معايير البحث غير صالحة', parsed.error.format());
    }
    const { q, type, page } = parsed.data;
    const { data, cached } = await SearchService.search(q, type, page);
    sendSuccess(res, data, { cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});

// 11. Source Discovery
const sourceParamsSchema = z.object({
  mediaType: z.enum(['movie', 'tv', 'series']),
  id: z.string().min(1),
});

const sourceQuerySchema = z.object({
  season: z.string().transform((v) => parseInt(v, 10)).optional(),
  episode: z.string().transform((v) => parseInt(v, 10)).optional(),
});

v1Router.get('/sources/:mediaType/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const paramsParsed = sourceParamsSchema.safeParse(req.params);
    if (!paramsParsed.success) {
      throw new ValidationError('معرّف المادة أو نوعها غير صالح');
    }
    const queryParsed = sourceQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      throw new ValidationError('رقم الموسم أو الحلقة غير صالح');
    }

    const mediaType = paramsParsed.data.mediaType === 'series' ? 'tv' : (paramsParsed.data.mediaType as MediaType);
    const id = paramsParsed.data.id;
    const season = queryParsed.data.season;
    const episode = queryParsed.data.episode;

    const result = await SourceService.resolveSources({
      mediaType,
      id,
      season,
      episode,
    });

    sendSuccess(res, result, { cached: result.cached, requestId: getReqId(req) });
  } catch (err) {
    next(err);
  }
});
