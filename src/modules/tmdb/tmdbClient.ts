import { env } from '../../config/index.js';
import { UpstreamError, UnauthorizedError } from '../../shared/errors.js';
import { logger } from '../../utils/logger.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TIMEOUT_MS = 10000;

export interface TmdbRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export async function tmdbFetch<T>(endpoint: string, options: TmdbRequestOptions = {}): Promise<T> {
  const token = env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new UnauthorizedError('مفتاح TMDB_READ_ACCESS_TOKEN غير مهيأ على الخادم');
  }

  const { params = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  // Default TMDB localized query
  url.searchParams.set('language', 'ar-SA');
  url.searchParams.set('region', 'DZ');
  url.searchParams.set('include_adult', 'false');

  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null) {
      url.searchParams.set(key, String(val));
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      logger.warn({ status: res.status, endpoint }, 'TMDB upstream responded with error status');
      if (res.status === 401 || res.status === 403) {
        throw new UnauthorizedError('رمز اعتماد TMDB غير صالح أو منتهي الصلاحية');
      }
      throw new UpstreamError(`فشل استعلام TMDB برمز ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      logger.error({ endpoint, timeoutMs }, 'TMDB upstream request timed out');
      throw new UpstreamError('انتهت مهلة استجابة مزود المحتوى الخارجي TMDB');
    }
    if (err instanceof UnauthorizedError || err instanceof UpstreamError) {
      throw err;
    }
    logger.error({ endpoint, err: err.message }, 'Failed to fetch TMDB data');
    throw new UpstreamError('تعذر الاتصال بخدمة TMDB');
  } finally {
    clearTimeout(timer);
  }
}
