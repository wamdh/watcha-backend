import { ParsedSource, SourceType, SourceKind } from '../../shared/types.js';
import { StremioStreamRaw } from '../addons/addonClient.js';

export class SourceParser {
  static parseStream(raw: StremioStreamRaw, index: number, providerName = 'Addon'): ParsedSource {
    const rawName = raw.name || '';
    const rawTitle = raw.title || '';
    const combined = `${rawName} ${rawTitle}`;

    // 1. Detect Source Type & Kind
    let sourceType: SourceType = 'unsupported';
    let kind: SourceKind = 'unsupported';
    let isPlayable = false;

    if (raw.url && /^https?:\/\//i.test(raw.url)) {
      sourceType = 'direct';
      kind = 'direct_url';
      isPlayable = true;
    } else if (raw.infoHash && /^[a-fA-F0-9]{40}$/i.test(raw.infoHash)) {
      sourceType = 'torrent';
      kind = 'torrent';
      isPlayable = true;
    }

    // 2. Resolution & Quality Badge
    let resolution = '720p';
    let qualityBadge = '720p HD';

    // Prioritize explicit tag in name (e.g. Torrentio\n1080p) or clear token
    if (/\b(4k|2160p|uhd)\b/i.test(rawName) || (/\b(4k|2160p|uhd)\b/i.test(rawTitle) && !/RM4K/i.test(rawTitle))) {
      resolution = '4K';
      qualityBadge = '4K UHD';
    } else if (/\b(1080p|fhd)\b/i.test(rawName) || /\b(1080p|fhd)\b/i.test(rawTitle)) {
      resolution = '1080p';
      qualityBadge = '1080p FHD';
    } else if (/\b(720p|hd)\b/i.test(rawName) || /\b(720p|hd)\b/i.test(rawTitle)) {
      resolution = '720p';
      qualityBadge = '720p HD';
    } else if (/\b(480p|sd)\b/i.test(combined)) {
      resolution = '480p';
      qualityBadge = '480p SD';
    } else if (/cam|ts|telesync/i.test(combined)) {
      resolution = 'CAM';
      qualityBadge = 'CAM';
    }

    // 3. HDR / Dolby Vision
    let hdr: string | undefined;
    if (/dolby\s*vision|\bdv\b/i.test(combined)) {
      hdr = 'Dolby Vision';
    } else if (/hdr10\+|hdr10|\bhdr\b/i.test(combined)) {
      hdr = 'HDR10';
    }

    // 4. Codec
    let codec = 'x264';
    if (/hevc|x265|h\.?265/i.test(combined)) {
      codec = 'HEVC/x265';
    } else if (/av1/i.test(combined)) {
      codec = 'AV1';
    } else if (/x264|h\.?264|avc/i.test(combined)) {
      codec = 'x264';
    }

    // 5. Audio
    let audio = 'Stereo';
    if (/atmos/i.test(combined)) {
      audio = 'Dolby Atmos';
    } else if (/7\.1/i.test(combined)) {
      audio = '7.1 Surround';
    } else if (/5\.1|ddp5\.1|ac3|dts/i.test(combined)) {
      audio = '5.1 Surround';
    }

    // 6. Seeders & Peers
    let seeders = 0;
    const seedersMatch = combined.match(/[👤⚙]\s*(\d+)/i) || combined.match(/(\d+)\s*(?:seeds?|seeders?)/i);
    if (seedersMatch && seedersMatch[1]) {
      seeders = parseInt(seedersMatch[1], 10);
    }

    // 7. File size text & bytes
    let fileSizeText = 'غير محدد';
    let fileSizeBytes = raw.behaviorHints?.videoSize || 0;

    const sizeMatch = combined.match(/💾\s*([\d\.]+\s*(?:GB|MB|GiB|MiB))/i) || combined.match(/([\d\.]+\s*(?:GB|MB|GiB|MiB))/i);
    if (sizeMatch && sizeMatch[1]) {
      fileSizeText = sizeMatch[1].toUpperCase().replace('GIB', 'GB').replace('MIB', 'MB');
      const num = parseFloat(sizeMatch[1]);
      if (/GB|GIB/i.test(sizeMatch[1])) {
        fileSizeBytes = Math.round(num * 1024 * 1024 * 1024);
      } else if (/MB|MIB/i.test(sizeMatch[1])) {
        fileSizeBytes = Math.round(num * 1024 * 1024);
      }
    }

    // 8. Clean title (file name without emojis/stats)
    const rawClean = (raw.title || raw.name || `Source #${index + 1}`).replace(/\n/g, ' ').trim();
    const strippedTitle = rawClean.split(/[👤💾⚙]/)[0].trim() || rawClean;

    // 9. Content Type
    let contentType: 'hls' | 'mp4' | 'other_supported' = 'mp4';
    if (raw.url?.toLowerCase().includes('.m3u8')) {
      contentType = 'hls';
    }

    return {
      id: `src_${sourceType}_${index}_${raw.infoHash || Math.random().toString(36).substring(2, 8)}`,
      sourceType,
      kind,
      provider: providerName,
      providerName,
      name: raw.name || providerName,
      title: strippedTitle,
      rawTitle: rawClean,
      resolution,
      qualityBadge,
      resolutionLabel: qualityBadge,
      codec,
      audio,
      hdr,
      fileSizeText,
      fileSize: fileSizeText,
      fileSizeBytes,
      seeders,
      peers: 0,
      isPlayable,
      contentType,
      ...(raw.url ? { streamUrl: raw.url, directUrl: raw.url } : {}),
      ...(raw.infoHash ? { infoHash: raw.infoHash.toLowerCase() } : {}),
      ...(raw.fileIdx !== undefined ? { fileIdx: raw.fileIdx } : {}),
    };
  }

  static sortSources(sources: ParsedSource[]): ParsedSource[] {
    const resRank = (r: string) => {
      switch (r) {
        case '4K': return 5;
        case '1080p': return 4;
        case '720p': return 3;
        case '480p': return 2;
        default: return 1;
      }
    };

    return [...sources].sort((a, b) => {
      // 1. Resolution
      const rDiff = resRank(b.resolution) - resRank(a.resolution);
      if (rDiff !== 0) return rDiff;
      // 2. Seeders
      if (b.seeders !== a.seeders) return b.seeders - a.seeders;
      // 3. File size
      return b.fileSizeBytes - a.fileSizeBytes;
    });
  }
}
