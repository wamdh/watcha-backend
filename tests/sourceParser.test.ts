import { describe, it, expect } from 'vitest';
import { SourceParser } from '../src/modules/sources/sourceParser.js';

describe('Source Parser', () => {
  it('parses torrent stream with resolution and seeders', () => {
    const raw = {
      name: 'Torrentio\n4K UHD',
      title: 'Inception.2010.2160p.UHD.BluRay.x265.10bit.Atmos-SWTYBLZ\n👤 142 💾 18.4 GB',
      infoHash: '4a2b9f87c1234567890abcdef1234567890abcde',
      fileIdx: 0,
    };

    const parsed = SourceParser.parseStream(raw, 0, 'Torrentio');
    expect(parsed.sourceType).toBe('torrent');
    expect(parsed.isPlayable).toBe(true);
    expect(parsed.resolution).toBe('4K');
    expect(parsed.qualityBadge).toBe('4K UHD');
    expect(parsed.codec).toBe('HEVC/x265');
    expect(parsed.audio).toBe('Dolby Atmos');
    expect(parsed.seeders).toBe(142);
    expect(parsed.fileSizeText).toContain('18.4');
    expect(parsed.infoHash).toBe('4a2b9f87c1234567890abcdef1234567890abcde');
    expect(parsed.fileIdx).toBe(0);
  });

  it('parses direct HTTP stream', () => {
    const raw = {
      name: 'Direct CDN',
      title: 'Stream 1080p FHD 5.1 💾 2.1 GB',
      url: 'https://cdn.example.com/videos/movie.mp4',
    };

    const parsed = SourceParser.parseStream(raw, 0, 'Direct CDN');
    expect(parsed.sourceType).toBe('direct');
    expect(parsed.isPlayable).toBe(true);
    expect(parsed.resolution).toBe('1080p');
    expect(parsed.qualityBadge).toBe('1080p FHD');
    expect(parsed.streamUrl).toBe('https://cdn.example.com/videos/movie.mp4');
  });

  it('sorts sources prioritizing 4K over 1080p and higher seeders', () => {
    const s1 = SourceParser.parseStream(
      { name: '1080p', title: '👤 500', infoHash: '1111111111111111111111111111111111111111' },
      0
    );
    const s2 = SourceParser.parseStream(
      { name: '4K', title: '👤 50', infoHash: '2222222222222222222222222222222222222222' },
      1
    );
    const s3 = SourceParser.parseStream(
      { name: '4K', title: '👤 200', infoHash: '3333333333333333333333333333333333333333' },
      2
    );

    const sorted = SourceParser.sortSources([s1, s2, s3]);
    expect(sorted[0].id).toBe(s3.id); // 4K with 200 seeds
    expect(sorted[1].id).toBe(s2.id); // 4K with 50 seeds
    expect(sorted[2].id).toBe(s1.id); // 1080p with 500 seeds
  });
});
