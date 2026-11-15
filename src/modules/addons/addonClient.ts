import { validateAddonUrl } from './addonValidator.js';
import { logger } from '../../utils/logger.js';

export interface StremioStreamRaw {
  name?: string;
  title?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  sources?: string[];
  subtitles?: any[];
  behaviorHints?: {
    bingeGroup?: string;
    proxyHeaders?: Record<string, string>;
    notWebReady?: boolean;
    videoSize?: number;
  };
}

export interface StremioStreamResponse {
  streams?: StremioStreamRaw[];
}

export class AddonClient {
  static async fetchStreams(
    manifestUrl: string,
    streamPath: string,
    timeoutMs = 8000
  ): Promise<StremioStreamRaw[]> {
    const validatedUrl = await validateAddonUrl(manifestUrl);
    // Base url without manifest.json
    const baseUrl = validatedUrl.href.replace(/\/manifest\.json$/i, '');
    const targetUrl = `${baseUrl}${streamPath}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WATCHA-Backend/1.0.0 (Production Node.js)',
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        logger.warn({ status: res.status, targetUrl }, 'Addon upstream returned non-200');
        return [];
      }

      const data = (await res.json()) as StremioStreamResponse;
      return Array.isArray(data?.streams) ? data.streams : [];
    } catch (err: any) {
      if (err.name === 'AbortError') {
        logger.warn({ targetUrl, timeoutMs }, 'Addon upstream timed out');
      } else {
        logger.warn({ targetUrl, err: err.message }, 'Failed to fetch addon streams');
      }
      return [];
    } finally {
      clearTimeout(timer);
    }
  }
}
