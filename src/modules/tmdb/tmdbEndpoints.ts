export const TMDB_ENDPOINTS = {
  // Trending
  trendingAllDay: '/trending/all/day',
  trendingAllWeek: '/trending/all/week',
  trendingMovieDay: '/trending/movie/day',
  trendingMovieWeek: '/trending/movie/week',
  trendingTVDay: '/trending/tv/day',
  trendingTVWeek: '/trending/tv/week',

  // Movies
  popularMovies: '/movie/popular',
  topRatedMovies: '/movie/top_rated',
  nowPlayingMovies: '/movie/now_playing',
  upcomingMovies: '/movie/upcoming',
  movieDetails: (id: number | string) => `/movie/${id}`,
  movieExternalIds: (id: number | string) => `/movie/${id}/external_ids`,

  // TV
  popularTV: '/tv/popular',
  topRatedTV: '/tv/top_rated',
  onTheAirTV: '/tv/on_the_air',
  airingTodayTV: '/tv/airing_today',
  tvDetails: (id: number | string) => `/tv/${id}`,
  tvExternalIds: (id: number | string) => `/tv/${id}/external_ids`,

  // Seasons & Episodes
  seasonDetails: (tvId: number | string, seasonNumber: number) =>
    `/tv/${tvId}/season/${seasonNumber}`,
  episodeDetails: (tvId: number | string, seasonNumber: number, episodeNumber: number) =>
    `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`,

  // Search
  searchMulti: '/search/multi',
  searchMovie: '/search/movie',
  searchTV: '/search/tv',
  discoverMovie: '/discover/movie',
  discoverTV: '/discover/tv',

  // Config & Auth validation
  configuration: '/configuration',
  authentication: '/authentication',
} as const;
