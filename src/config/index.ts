import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('10000'),
  HOST: z.string().default('0.0.0.0'),
  TMDB_READ_ACCESS_TOKEN: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().default('*'),
  REDIS_URL: z.string().optional(),
  DEFAULT_STREMIO_ADDON_URL: z
    .string()
    .url()
    .default('https://torrentio.strem.fun/manifest.json'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('60000'),
  RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('120'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Environment configuration validation failed:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

export const CACHE_TTL = {
  TRENDING_SECONDS: 900,         // 15 minutes
  POPULAR_SECONDS: 1800,         // 30 minutes
  TOP_RATED_SECONDS: 3600,       // 1 hour
  HOME_CATALOG_SECONDS: 900,     // 15 minutes
  MOVIE_DETAILS_SECONDS: 21600,  // 6 hours
  SERIES_DETAILS_SECONDS: 21600, // 6 hours
  SEASON_DETAILS_SECONDS: 21600, // 6 hours
  EXTERNAL_IDS_SECONDS: 86400,   // 24 hours
  SEARCH_RESULTS_SECONDS: 300,   // 5 minutes
  SOURCE_METADATA_SECONDS: 300,  // 5 minutes
} as const;
