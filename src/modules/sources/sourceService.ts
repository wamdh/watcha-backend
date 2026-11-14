import { ExternalIdService } from '../external-ids/externalIdService.js';
import { AddonClient } from '../addons/addonClient.js';
import { SourceParser } from './sourceParser.js';
import { defaultCacheService } from '../cache/CacheService.js';
import { env, CACHE_TTL } from '../../config/index.js';
import { StreamDiscoveryResult, MediaType } from '../../shared/types.js';
import { NotFoundError } from '../../shared/errors.js';

export class SourceService {
  static async resolveSources(options: {
    mediaType: MediaType;
    id: string; // could be "movie_123", "tv_456", "123", or "tt1234567"
    season?: number;
    episode?: number;
  }): Promise<StreamDiscoveryResult> {
    const { mediaType, id, season, episode } = options;

    let imdbId: string | null = null;
    if (ExternalIdService.isValidImdbId(id)) {
      imdbId = id;
    } else {
      imdbId = await ExternalIdService.getImdbId(mediaType, id);
    }

    if (!imdbId) {
      throw new NotFoundError('لم يتم العثور على معرّف IMDb لهذا المحتوى للبحث عن مصادر التشغيل');
    }

    const streamPath =
      mediaType === 'movie'
        ? `/stream/movie/${imdbId}.json`
        : `/stream/series/${imdbId}:${season || 1}:${episode || 1}.json`;

    const cacheKey = `sources:${mediaType}:${imdbId}:${season || 0}:${episode || 0}`;

    const { data, cached } = await defaultCacheService.getOrSet(
      cacheKey,
      CACHE_TTL.SOURCE_METADATA_SECONDS,
      async () => {
        const rawStreams = await AddonClient.fetchStreams(
          env.DEFAULT_STREMIO_ADDON_URL,
          streamPath,
          8000
        );

        const parsedList = rawStreams.map((s, idx) =>
          SourceParser.parseStream(s, idx, 'Torrentio')
        );

        const playableSources = SourceParser.sortSources(
          parsedList.filter((s) => s.sourceType === 'direct')
        );
        const torrentSources = SourceParser.sortSources(
          parsedList.filter((s) => s.sourceType === 'torrent')
        );
        const unsupportedSources = parsedList.filter((s) => s.sourceType === 'unsupported');

        const result: StreamDiscoveryResult = {
          imdbId: imdbId!,
          mediaType,
          season,
          episode,
          playableSources,
          torrentSources,
          unsupportedSources,
          totalStreams: rawStreams.length,
          cached: false,
        };

        return result;
      }
    );

    return { ...data, cached };
  }
}
