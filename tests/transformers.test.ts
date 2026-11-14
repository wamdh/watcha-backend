import { describe, it, expect } from 'vitest';
import {
  resolveDisplayTitle,
  formatArabicRuntime,
  extractReleaseYear,
  getPosterUrl,
  getBackdropUrl,
  transformMovieRaw,
  transformTVRaw,
} from '../src/modules/tmdb/tmdbTransformers.js';

describe('TMDB Data Transformers', () => {
  it('prefers English title when original_title is in Latin letters', () => {
    const title = resolveDisplayTitle('استهلال', 'Inception');
    expect(title).toBe('Inception');
  });

  it('falls back gracefully when title is Arabic only', () => {
    const title = resolveDisplayTitle('صراع العروش', 'صراع العروش');
    expect(title).toBe('صراع العروش');
  });

  it('formats Arabic runtimes correctly', () => {
    expect(formatArabicRuntime(148)).toBe('2 س 28 د');
    expect(formatArabicRuntime(120)).toBe('2 س');
    expect(formatArabicRuntime(45)).toBe('45 د');
    expect(formatArabicRuntime(0)).toBe('غير محدد');
  });

  it('extracts release years safely', () => {
    expect(extractReleaseYear('2024-05-18')).toBe(2024);
    expect(extractReleaseYear('1999-11-20')).toBe(1999);
    expect(extractReleaseYear(undefined)).toBe(new Date().getFullYear());
  });

  it('generates secure image URLs', () => {
    const poster = getPosterUrl('/sample.jpg', 'md');
    expect(poster).toBe('https://image.tmdb.org/t/p/w342/sample.jpg');

    const backdrop = getBackdropUrl('/backdrop.jpg', 'lg');
    expect(backdrop).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg');
  });

  it('transforms raw TMDB movie into MediaItem with match percentage and genres', () => {
    const raw = {
      id: 550,
      title: 'نادي القتال',
      original_title: 'Fight Club',
      overview: 'An insomniac office worker...',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      release_date: '1999-10-15',
      vote_average: 8.433,
      vote_count: 28000,
      genre_ids: [18, 53],
    };

    const transformed = transformMovieRaw(raw);
    expect(transformed.id).toBe('movie_550');
    expect(transformed.title).toBe('Fight Club');
    expect(transformed.rating).toBe(8.4);
    expect(transformed.matchPercentage).toBe(84);
    expect(transformed.genres).toContain('دراما');
    expect(transformed.genres).toContain('إثارة');
  });

  it('transforms raw TMDB TV into MediaItem', () => {
    const raw = {
      id: 1399,
      name: 'صراع العروش',
      original_name: 'Game of Thrones',
      overview: 'Nine noble families...',
      poster_path: '/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg',
      backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
      first_air_date: '2011-04-17',
      vote_average: 8.45,
      vote_count: 22000,
      genre_ids: [10765, 18],
    };

    const transformed = transformTVRaw(raw);
    expect(transformed.id).toBe('tv_1399');
    expect(transformed.title).toBe('Game of Thrones');
    expect(transformed.rating).toBe(8.4);
    expect(transformed.matchPercentage).toBe(84);
  });
});
