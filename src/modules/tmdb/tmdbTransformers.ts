import {
  MediaItem,
  MovieDetails,
  SeriesDetails,
  SeasonDetails,
  EpisodeItem,
  CastItem,
  VideoTrailer,
  SeasonSummary,
} from '../../shared/types.js';
import { getArabicGenresForIds } from './arabicGenres.js';

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const NO_ARABIC_OVERVIEW = 'لا يتوفر وصف باللغة العربية.';

export function getPosterUrl(path?: string | null, size: 'sm' | 'md' | 'lg' | 'original' = 'md'): string {
  if (!path) return '';
  const sizeMap = { sm: 'w185', md: 'w342', lg: 'w500', original: 'original' };
  return `${IMAGE_BASE_URL}/${sizeMap[size]}${path}`;
}

export function getBackdropUrl(path?: string | null, size: 'sm' | 'md' | 'lg' | 'original' = 'lg'): string {
  if (!path) return '';
  const sizeMap = { sm: 'w300', md: 'w780', lg: 'w1280', original: 'original' };
  return `${IMAGE_BASE_URL}/${sizeMap[size]}${path}`;
}

export function getProfileUrl(path?: string | null): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/w185${path}`;
}

export function getStillUrl(path?: string | null): string {
  if (!path) return '';
  return `${IMAGE_BASE_URL}/w300${path}`;
}

export function resolveDisplayTitle(localizedTitle?: string, originalTitle?: string): string {
  // If originalTitle contains Latin / English letters, prefer English as requested by user
  if (originalTitle && /[a-zA-Z]/.test(originalTitle)) {
    return originalTitle.trim();
  }
  if (localizedTitle && /[a-zA-Z]/.test(localizedTitle)) {
    return localizedTitle.trim();
  }
  return (originalTitle && originalTitle.trim()) || (localizedTitle && localizedTitle.trim()) || '';
}

export function formatArabicRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return 'غير محدد';
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) return `${hours} س ${remainingMins} د`;
  if (hours > 0) return `${hours} س`;
  return `${remainingMins} د`;
}

export function extractReleaseYear(dateString?: string): number {
  if (!dateString) return new Date().getFullYear();
  const year = parseInt(dateString.substring(0, 4), 10);
  return isNaN(year) ? new Date().getFullYear() : year;
}

export function formatBudget(amount?: number): string {
  if (!amount || amount <= 0) return 'غير معلن';
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  return `$${amount.toLocaleString()}`;
}

export function transformMovieRaw(raw: any): MediaItem {
  const title = resolveDisplayTitle(raw.title, raw.original_title);
  const overview = (raw.overview && raw.overview.trim()) || NO_ARABIC_OVERVIEW;
  const rating = Number((raw.vote_average || 0).toFixed(1));
  const matchPercentage = Math.min(99, Math.max(60, Math.round(rating * 10)));
  const genreIds = raw.genre_ids || (raw.genres ? raw.genres.map((g: any) => g.id) : []);

  return {
    id: `movie_${raw.id}`,
    tmdbId: raw.id,
    mediaType: 'movie',
    title,
    originalTitle: raw.original_title || title,
    overview,
    posterUrl: getPosterUrl(raw.poster_path, 'md'),
    backdropUrl: getBackdropUrl(raw.backdrop_path, 'lg'),
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseYear: extractReleaseYear(raw.release_date),
    releaseDate: raw.release_date || '',
    rating,
    voteCount: raw.vote_count || 0,
    matchPercentage,
    genres: getArabicGenresForIds(genreIds),
    genreIds,
    ageRating: raw.adult ? '+18' : 'PG-13',
  };
}

export function transformTVRaw(raw: any): MediaItem {
  const title = resolveDisplayTitle(raw.name, raw.original_name);
  const overview = (raw.overview && raw.overview.trim()) || NO_ARABIC_OVERVIEW;
  const rating = Number((raw.vote_average || 0).toFixed(1));
  const matchPercentage = Math.min(99, Math.max(60, Math.round(rating * 10)));
  const genreIds = raw.genre_ids || (raw.genres ? raw.genres.map((g: any) => g.id) : []);

  return {
    id: `tv_${raw.id}`,
    tmdbId: raw.id,
    mediaType: 'tv',
    title,
    originalTitle: raw.original_name || title,
    overview,
    posterUrl: getPosterUrl(raw.poster_path, 'md'),
    backdropUrl: getBackdropUrl(raw.backdrop_path, 'lg'),
    posterPath: raw.poster_path || null,
    backdropPath: raw.backdrop_path || null,
    releaseYear: extractReleaseYear(raw.first_air_date),
    releaseDate: raw.first_air_date || '',
    rating,
    voteCount: raw.vote_count || 0,
    matchPercentage,
    genres: getArabicGenresForIds(genreIds),
    genreIds,
    ageRating: raw.adult ? '+18' : 'PG-13',
  };
}

export function transformMovieDetails(raw: any): MovieDetails {
  const base = transformMovieRaw(raw);

  const cast: CastItem[] = (raw.credits?.cast || []).slice(0, 15).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character || '',
    profileUrl: getProfileUrl(c.profile_path),
    order: c.order || 0,
  }));

  const trailers: VideoTrailer[] = (raw.videos?.results || [])
    .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .slice(0, 5)
    .map((v: any) => ({
      id: v.id,
      name: v.name,
      youtubeKey: v.key,
      type: v.type,
    }));

  const similar = (raw.similar?.results || []).slice(0, 10).map(transformMovieRaw);
  const recommendations = (raw.recommendations?.results || []).slice(0, 10).map(transformMovieRaw);

  return {
    ...base,
    runtimeMinutes: raw.runtime || 0,
    runtimeFormatted: formatArabicRuntime(raw.runtime),
    tagline: raw.tagline || '',
    status: raw.status || '',
    budgetFormatted: formatBudget(raw.budget),
    revenueFormatted: formatBudget(raw.revenue),
    cast,
    trailers,
    similar,
    recommendations,
  };
}

export function transformTVDetails(raw: any): SeriesDetails {
  const base = transformTVRaw(raw);

  const seasons: SeasonSummary[] = (raw.seasons || [])
    .filter((s: any) => s.season_number > 0)
    .map((s: any) => ({
      id: s.id,
      seasonNumber: s.season_number,
      name: s.name || `الموسم ${s.season_number}`,
      episodeCount: s.episode_count || 0,
      posterUrl: getPosterUrl(s.poster_path, 'sm'),
      airDate: s.air_date,
    }));

  const cast: CastItem[] = (raw.credits?.cast || []).slice(0, 15).map((c: any) => ({
    id: c.id,
    name: c.name,
    character: c.character || '',
    profileUrl: getProfileUrl(c.profile_path),
    order: c.order || 0,
  }));

  const trailers: VideoTrailer[] = (raw.videos?.results || [])
    .filter((v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'))
    .slice(0, 5)
    .map((v: any) => ({
      id: v.id,
      name: v.name,
      youtubeKey: v.key,
      type: v.type,
    }));

  const similar = (raw.similar?.results || []).slice(0, 10).map(transformTVRaw);
  const recommendations = (raw.recommendations?.results || []).slice(0, 10).map(transformTVRaw);

  return {
    ...base,
    numberOfSeasons: raw.number_of_seasons || seasons.length,
    numberOfEpisodes: raw.number_of_episodes || 0,
    seasons,
    status: raw.status || '',
    tagline: raw.tagline || '',
    cast,
    trailers,
    similar,
    recommendations,
  };
}

export function transformSeasonDetails(raw: any): SeasonDetails {
  const episodes: EpisodeItem[] = (raw.episodes || []).map((ep: any) => ({
    id: ep.id,
    episodeNumber: ep.episode_number,
    seasonNumber: ep.season_number,
    name: ep.name || `الحلقة ${ep.episode_number}`,
    overview: (ep.overview && ep.overview.trim()) || NO_ARABIC_OVERVIEW,
    stillUrl: getStillUrl(ep.still_path),
    runtimeMinutes: ep.runtime || 0,
    runtimeFormatted: formatArabicRuntime(ep.runtime),
    rating: Number((ep.vote_average || 0).toFixed(1)),
    airDate: ep.air_date || '',
  }));

  return {
    id: raw.id,
    seasonNumber: raw.season_number,
    name: raw.name || `الموسم ${raw.season_number}`,
    overview: (raw.overview && raw.overview.trim()) || NO_ARABIC_OVERVIEW,
    posterUrl: getPosterUrl(raw.poster_path, 'md'),
    episodes,
  };
}
