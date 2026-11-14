export type MediaType = 'movie' | 'tv';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    cached: boolean;
    requestId?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface MediaItem {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number;
  releaseDate: string;
  rating: number;
  voteCount: number;
  matchPercentage: number;
  genres: string[];
  genreIds: number[];
  ageRating: string;
}

export interface CastItem {
  id: number;
  name: string;
  character: string;
  profileUrl: string;
  order: number;
}

export interface VideoTrailer {
  id: string;
  name: string;
  youtubeKey: string;
  type: string;
}

export interface MovieDetails extends MediaItem {
  runtimeMinutes: number;
  runtimeFormatted: string;
  tagline: string;
  status: string;
  budgetFormatted: string;
  revenueFormatted: string;
  cast: CastItem[];
  trailers: VideoTrailer[];
  similar: MediaItem[];
  recommendations: MediaItem[];
}

export interface SeasonSummary {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl: string;
  airDate?: string;
}

export interface SeriesDetails extends MediaItem {
  numberOfSeasons: number;
  numberOfEpisodes: number;
  seasons: SeasonSummary[];
  status: string;
  tagline: string;
  cast: CastItem[];
  trailers: VideoTrailer[];
  similar: MediaItem[];
  recommendations: MediaItem[];
}

export interface EpisodeItem {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillUrl: string;
  runtimeMinutes: number;
  runtimeFormatted: string;
  rating: number;
  airDate: string;
}

export interface SeasonDetails {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterUrl: string;
  episodes: EpisodeItem[];
}

export interface HomeCatalog {
  featured: MediaItem | null;
  trendingDay: MediaItem[];
  trendingWeek: MediaItem[];
  popularMovies: MediaItem[];
  popularTV: MediaItem[];
  topRated: MediaItem[];
  nowPlaying: MediaItem[];
  upcoming: MediaItem[];
  onTheAir: MediaItem[];
}

// Source & Playback types
export type SourceType = 'direct' | 'torrent' | 'unsupported';
export type SourceKind = 'direct_url' | 'torrent' | 'unsupported';

export interface ParsedSource {
  id: string;
  sourceType: SourceType;
  kind: SourceKind;
  provider: string;
  providerName: string;
  name: string;
  title: string;
  rawTitle: string;
  resolution: string;      // e.g. "4K", "1080p", "720p"
  qualityBadge: string;    // e.g. "4K UHD", "1080p FHD"
  resolutionLabel: string; // alias for qualityBadge / mobile UI
  codec: string;           // e.g. "x265", "x264", "HEVC"
  audio: string;           // e.g. "5.1", "7.1", "Atmos"
  hdr?: string;            // e.g. "HDR10", "Dolby Vision"
  fileSizeText: string;    // e.g. "2.4 GB"
  fileSize: string;        // alias for fileSizeText
  fileSizeBytes: number;
  seeders: number;
  peers: number;
  isPlayable: boolean;
  // Direct stream
  streamUrl?: string;
  directUrl?: string;      // alias for streamUrl
  // Torrent swarm
  infoHash?: string;
  fileIdx?: number;
  contentType: 'hls' | 'mp4' | 'other_supported';
}

export interface StreamDiscoveryResult {
  imdbId: string;
  mediaType: MediaType;
  season?: number;
  episode?: number;
  playableSources: ParsedSource[];
  torrentSources: ParsedSource[];
  unsupportedSources: ParsedSource[];
  totalStreams: number;
  cached: boolean;
}
