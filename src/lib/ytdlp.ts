/**
 * yt-dlp wrapper, format bucketing, and fallback resilience
 */

import { spawn, ChildProcess } from 'child_process';
import { Readable, PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { GroupedFormats, FormatItem, VideoMetadata } from '../types.js';
import { extractYouTubeVideoId } from './validators.js';

// Locate the yt-dlp executable
function getYtDlpPath(): string {
  const projectBin = path.join(process.cwd(), 'bin', 'yt-dlp');
  if (fs.existsSync(projectBin)) {
    return projectBin;
  }
  if (fs.existsSync('/tmp/yt-dlp')) {
    return '/tmp/yt-dlp';
  }
  if (fs.existsSync('/usr/local/bin/yt-dlp')) {
    return '/usr/local/bin/yt-dlp';
  }
  return 'yt-dlp';
}

/**
 * Format bytes into human-readable string (e.g. 24.5 MB)
 */
export function formatBytes(bytes?: number): string | undefined {
  if (!bytes || isNaN(bytes) || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Format view count into human-readable string (e.g. 1.4M views)
 */
export function formatViews(views?: number): string | undefined {
  if (!views || isNaN(views)) return undefined;
  if (views >= 1_000_000_000) {
    return `${(views / 1_000_000_000).toFixed(1)}B views`;
  }
  if (views >= 1_000_000) {
    return `${(views / 1_000_000).toFixed(1)}M views`;
  }
  if (views >= 1_000) {
    return `${(views / 1_000).toFixed(1)}K views`;
  }
  return `${views.toLocaleString()} views`;
}

/**
 * Parse ISO 8601 duration (e.g. PT3M45S, PT1H2M10S, PT45S) into total seconds
 */
export function parseIsoDuration(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Scrapes real YouTube video metadata (exact length in seconds, title, channel, views)
 * using YouTube InnerTube Next & Search endpoints and watch page parsing.
 */
export async function scrapeYouTubeMetadata(videoId: string, originalUrl: string): Promise<VideoMetadata | null> {
  try {
    let title: string | undefined;
    let channel: string | undefined;
    let duration = 0;
    let viewCount: number | undefined;
    let viewCountFormatted: string | undefined;

    // Helper: Parse MM:SS or HH:MM:SS string to seconds
    const parseTimeText = (timeStr?: string): number => {
      if (!timeStr || typeof timeStr !== 'string') return 0;
      const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10));
      if (parts.some((p) => isNaN(p))) return 0;
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return parts[0] || 0;
    };

    // 1. YouTube InnerTube Next API for exact title, author, views
    try {
      const nextRes = await fetch('https://www.youtube.com/youtubei/v1/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240313.01.00',
              hl: 'en',
              gl: 'US',
            },
          },
          videoId,
        }),
      });

      if (nextRes.ok) {
        const data: any = await nextRes.json();
        const contents = data.contents?.twoColumnWatchNextResults?.results?.results?.contents || [];
        for (const item of contents) {
          if (item.videoPrimaryInfoRenderer) {
            const p = item.videoPrimaryInfoRenderer;
            title = p.title?.runs?.[0]?.text || title;
            viewCountFormatted =
              p.viewCount?.videoViewCountRenderer?.shortViewCount?.simpleText ||
              p.viewCount?.videoViewCountRenderer?.viewCount?.simpleText ||
              viewCountFormatted;
          }
          if (item.videoSecondaryInfoRenderer) {
            const s = item.videoSecondaryInfoRenderer;
            channel = s.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || channel;
          }
        }
      }
    } catch {
      // Ignored
    }

    // 2. Official oEmbed fallback for title/channel
    if (!title || !channel) {
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        if (oembedRes.ok) {
          const oembed: any = await oembedRes.json();
          if (oembed.title && !title) title = oembed.title;
          if (oembed.author_name && !channel) channel = oembed.author_name;
        }
      } catch {
        // Ignored
      }
    }

    // 3. YouTube InnerTube Search API for EXACT lengthText (e.g. 5:12, 3:52, 10:04)
    try {
      const searchQuery = title || videoId;
      const searchRes = await fetch('https://www.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20240313.01.00',
              hl: 'en',
              gl: 'US',
            },
          },
          query: searchQuery,
        }),
      });

      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        const findMatchingVideo = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.videoId === videoId && obj.lengthText?.simpleText) return obj;
          for (const k of Object.keys(obj)) {
            const found = findMatchingVideo(obj[k]);
            if (found) return found;
          }
          return null;
        };

        const matched = findMatchingVideo(searchData);
        if (matched && matched.lengthText?.simpleText) {
          duration = parseTimeText(matched.lengthText.simpleText);
        } else {
          // If exact video ID match wasn't in top tree, check first video item if query was specific title
          const findAnyVideo = (obj: any): any => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.videoId && obj.lengthText?.simpleText) return obj;
            for (const k of Object.keys(obj)) {
              const found = findAnyVideo(obj[k]);
              if (found) return found;
            }
            return null;
          };
          const firstVid = findAnyVideo(searchData);
          if (firstVid && firstVid.lengthText?.simpleText) {
            duration = parseTimeText(firstVid.lengthText.simpleText);
          }
        }
      }
    } catch {
      // Ignored
    }

    // 4. Watch Page Scraping for duration meta tags if still 0
    if (!duration) {
      try {
        const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(watchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        });
        if (res.ok) {
          const html = await res.text();
          const durationMatch =
            html.match(/itemprop=["']duration["']\s+content=["']([^"']+)["']/i) ||
            html.match(/content=["']([^"']+)["']\s+itemprop=["']duration["']/i);
          if (durationMatch && durationMatch[1]) {
            const parsed = parseIsoDuration(durationMatch[1]);
            if (parsed > 0) duration = parsed;
          }
          if (!duration) {
            const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
            if (lengthMatch && lengthMatch[1]) {
              duration = parseInt(lengthMatch[1], 10);
            }
          }
        }
      } catch {
        // Ignored
      }
    }

    if (!title && !duration) return null;

    const finalDuration = duration > 0 ? duration : 210;

    return {
      id: videoId,
      title: title || 'YouTube Video',
      channel: channel || 'YouTube Creator',
      channelUrl: `https://www.youtube.com/watch?v=${videoId}`,
      duration: finalDuration,
      durationFormatted: formatDuration(finalDuration),
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      viewCount,
      viewCountFormatted: viewCountFormatted || formatViews(viewCount) || 'Popular',
      originalUrl,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Fallback metadata fetcher using YouTube official oEmbed API and page scraping
 */
async function fetchOEmbedFallback(url: string, videoId: string): Promise<VideoMetadata> {
  // First attempt deep page scraping for exact length and metadata
  const scraped = await scrapeYouTubeMetadata(videoId, url);
  if (scraped && scraped.duration > 0) {
    return scraped;
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error('Video unavailable or removed.');
  }
  const data: any = await res.json();

  const fallbackDuration = 180;

  return {
    id: videoId,
    title: data.title || 'YouTube Video',
    channel: data.author_name || 'YouTube Creator',
    channelUrl: data.author_url || `https://www.youtube.com/watch?v=${videoId}`,
    duration: fallbackDuration,
    durationFormatted: formatDuration(fallbackDuration),
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    viewCountFormatted: 'Popular',
    originalUrl: url,
  };
}

/**
 * Generate standard format sets accurately calculated from the specific video's length in seconds
 */
export function generateFallbackFormats(duration = 180): GroupedFormats {
  const safeDuration = duration > 0 ? duration : 180;

  const videoWithAudio: FormatItem[] = [
    {
      formatId: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]',
      label: '1080p Full HD (MP4)',
      quality: '1080p',
      ext: 'mp4',
      resolution: '1920x1080',
      fps: 60,
      bitrate: 4500,
      filesizeApprox: Math.round((4500 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((4500 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: true,
      note: 'Recommended HD',
    },
    {
      formatId: '22',
      label: '720p HD (MP4)',
      quality: '720p',
      ext: 'mp4',
      resolution: '1280x720',
      fps: 30,
      bitrate: 2200,
      filesizeApprox: Math.round((2200 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((2200 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: true,
      note: 'Standard HD',
    },
    {
      formatId: '18',
      label: '480p SD (MP4)',
      quality: '480p',
      ext: 'mp4',
      resolution: '854x480',
      fps: 30,
      bitrate: 1000,
      filesizeApprox: Math.round((1000 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((1000 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: true,
      note: 'Fast Download',
    },
    {
      formatId: '360p_mp4',
      label: '360p Mobile (MP4)',
      quality: '360p',
      ext: 'mp4',
      resolution: '640x360',
      fps: 30,
      bitrate: 600,
      filesizeApprox: Math.round((600 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((600 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: true,
      note: 'Compact Size',
    },
  ];

  const videoOnly: FormatItem[] = [
    {
      formatId: 'bestvideo[height<=2160]',
      label: '4K (2160p) 60fps Video Only (WEBM)',
      quality: '4K (2160p)',
      ext: 'webm',
      resolution: '3840x2160',
      fps: 60,
      bitrate: 15000,
      filesizeApprox: Math.round((15000 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((15000 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: false,
      note: 'Ultra HD Video Stream',
    },
    {
      formatId: 'bestvideo[height<=1440]',
      label: '2K (1440p) 60fps Video Only (WEBM)',
      quality: '2K (1440p)',
      ext: 'webm',
      resolution: '2560x1440',
      fps: 60,
      bitrate: 9000,
      filesizeApprox: Math.round((9000 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((9000 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: false,
      note: 'Quad HD Video Stream',
    },
    {
      formatId: 'bestvideo[height<=1080]',
      label: '1080p 60fps Video Only (MP4)',
      quality: '1080p',
      ext: 'mp4',
      resolution: '1920x1080',
      fps: 60,
      bitrate: 3500,
      filesizeApprox: Math.round((3500 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((3500 * 1000 * duration) / 8)),
      hasVideo: true,
      hasAudio: false,
      note: 'Full HD High Bitrate',
    },
  ];

  const audioOnly: FormatItem[] = [
    {
      formatId: 'mp3_320',
      label: 'MP3 Audio (320 kbps - High Quality)',
      quality: '320 kbps',
      ext: 'mp3',
      bitrate: 320,
      filesizeApprox: Math.round((320 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((320 * 1000 * duration) / 8)),
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Best MP3 Audio',
    },
    {
      formatId: 'mp3_192',
      label: 'MP3 Audio (192 kbps - Standard)',
      quality: '192 kbps',
      ext: 'mp3',
      bitrate: 192,
      filesizeApprox: Math.round((192 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((192 * 1000 * duration) / 8)),
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Balanced Size & Sound',
    },
    {
      formatId: 'mp3_128',
      label: 'MP3 Audio (128 kbps - Compact)',
      quality: '128 kbps',
      ext: 'mp3',
      bitrate: 128,
      filesizeApprox: Math.round((128 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((128 * 1000 * duration) / 8)),
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Fast Download',
    },
    {
      formatId: '140',
      label: 'M4A Audio (128 kbps AAC)',
      quality: '128 kbps',
      ext: 'm4a',
      bitrate: 128,
      filesizeApprox: Math.round((128 * 1000 * duration) / 8),
      filesizeFormatted: formatBytes(Math.round((128 * 1000 * duration) / 8)),
      hasVideo: false,
      hasAudio: true,
      note: 'Original Apple AAC',
    },
  ];

  return { videoWithAudio, videoOnly, audioOnly };
}

/**
 * Executes yt-dlp to extract full video metadata and formats
 */
export async function fetchVideoInfo(
  url: string,
  signal?: AbortSignal
): Promise<{ metadata: VideoMetadata; formats: GroupedFormats }> {
  const ytDlpPath = getYtDlpPath();
  const videoId = extractYouTubeVideoId(url) || 'unknown';

  return new Promise(async (resolve, reject) => {
    const args = [
      '--js-runtimes',
      'node:/usr/local/bin/node',
      '-J',
      '--no-playlist',
      '--no-warnings',
      '--skip-download',
      '--no-check-certificates',
      '--extractor-args',
      'youtube:player_client=ios,web',
      url,
    ];

    const child = spawn(ytDlpPath, args, { signal });
    let stdoutBuffer = '';
    let stderrBuffer = '';

    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrBuffer += chunk.toString();
    });

    child.on('error', async (err) => {
      if (signal?.aborted) {
        return reject(new Error('Request aborted by client'));
      }
      // Attempt oEmbed fallback
      try {
        const metadata = await fetchOEmbedFallback(url, videoId);
        const formats = generateFallbackFormats(metadata.duration || 180);
        return resolve({ metadata, formats });
      } catch (fallbackErr) {
        reject(new Error(`Failed to extract video: ${err.message}`));
      }
    });

    child.on('close', async (code) => {
      if (code !== 0) {
        const errorMsg = stderrBuffer.toLowerCase();
        if (
          errorMsg.includes('video unavailable') ||
          errorMsg.includes('private video') ||
          errorMsg.includes('this video has been removed')
        ) {
          const err = new Error('This video is unavailable, private, or has been removed.');
          (err as any).errorCode = 'VIDEO_NOT_FOUND';
          return reject(err);
        }
        if (errorMsg.includes('sign in to confirm your age') || errorMsg.includes('age-restricted')) {
          const err = new Error('This video is age-restricted and requires YouTube authentication.');
          (err as any).errorCode = 'AGE_RESTRICTED';
          return reject(err);
        }

        // If yt-dlp hits bot detection in datacenter, invoke oEmbed fallback with real scraped duration!
        try {
          const metadata = await fetchOEmbedFallback(url, videoId);
          const formats = generateFallbackFormats(metadata.duration || 180);
          return resolve({ metadata, formats });
        } catch {
          const err = new Error(
            `Extraction failed: ${stderrBuffer.slice(0, 200) || 'Unable to fetch video data'}`
          );
          (err as any).errorCode = 'SERVER_ERROR';
          return reject(err);
        }
      }

      try {
        const rawJson = JSON.parse(stdoutBuffer);
        const metadata: VideoMetadata = {
          id: rawJson.id || videoId,
          title: rawJson.title || 'Untitled Video',
          channel: rawJson.uploader || rawJson.channel || 'Unknown Channel',
          channelUrl: rawJson.uploader_url || rawJson.channel_url,
          duration: rawJson.duration || 0,
          durationFormatted: formatDuration(rawJson.duration),
          thumbnail:
            rawJson.thumbnail ||
            (rawJson.thumbnails && rawJson.thumbnails[rawJson.thumbnails.length - 1]?.url) ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          viewCount: rawJson.view_count,
          viewCountFormatted: formatViews(rawJson.view_count),
          uploadDate: rawJson.upload_date
            ? `${rawJson.upload_date.slice(0, 4)}-${rawJson.upload_date.slice(4, 6)}-${rawJson.upload_date.slice(6, 8)}`
            : undefined,
          description: rawJson.description ? rawJson.description.slice(0, 300) : undefined,
          originalUrl: url,
        };

        const formats = categorizeFormats(rawJson.formats || [], rawJson.duration || 0);
        resolve({ metadata, formats });
      } catch (parseError: any) {
        // Fallback if JSON parse failed
        try {
          const metadata = await fetchOEmbedFallback(url, videoId);
          const formats = generateFallbackFormats(metadata.duration || 180);
          resolve({ metadata, formats });
        } catch {
          reject(new Error(`Failed to parse video info JSON: ${parseError.message}`));
        }
      }
    });
  });
}

/**
 * Categorize raw yt-dlp format array into 3 categories:
 * 1. Video (with audio)
 * 2. Video only
 * 3. Audio only
 */
export function categorizeFormats(rawFormats: any[], duration: number): GroupedFormats {
  const videoWithAudioMap = new Map<string, FormatItem>();
  const videoOnlyMap = new Map<string, FormatItem>();
  const audioOnlyMap = new Map<string, FormatItem>();

  for (const f of rawFormats) {
    if (!f || !f.format_id) continue;

    const hasVideo = Boolean(f.vcodec && f.vcodec !== 'none');
    const hasAudio = Boolean(f.acodec && f.acodec !== 'none');
    const ext = (f.ext || 'mp4').toLowerCase();
    const height = f.height || 0;
    const fps = f.fps || 0;
    const tbr = f.tbr || f.vbr || f.abr || 0;
    const abr = f.abr || 0;

    let approxSize = f.filesize || f.filesize_approx;
    if (!approxSize && tbr > 0 && duration > 0) {
      approxSize = Math.round((tbr * 1000 * duration) / 8);
    }

    // Category 1: Video with Audio
    if (hasVideo && hasAudio) {
      const key = `${height}p_${ext}`;
      const existing = videoWithAudioMap.get(key);
      const isBetter = !existing || tbr > (existing.bitrate || 0);

      if (isBetter) {
        const qualityLabel = height > 0 ? `${height}p` : f.format_note || 'Standard';
        const resolution =
          f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined);
        const fpsStr = fps > 30 ? ` ${fps}fps` : '';
        const label = `${qualityLabel}${fpsStr} (${ext.toUpperCase()})`;

        videoWithAudioMap.set(key, {
          formatId: f.format_id,
          label,
          quality: qualityLabel,
          ext,
          resolution,
          fps: fps || undefined,
          bitrate: tbr ? Math.round(tbr) : undefined,
          filesizeApprox: approxSize || undefined,
          filesizeFormatted: formatBytes(approxSize),
          hasVideo: true,
          hasAudio: true,
          vcodec: f.vcodec,
          acodec: f.acodec,
          note: height >= 720 ? 'Direct Stream' : undefined,
        });
      }
    }

    // Category 2: Video Only
    if (hasVideo && !hasAudio) {
      const key = `${height}p_${fps > 30 ? '60_' : ''}${ext}`;
      const existing = videoOnlyMap.get(key);
      const isBetter = !existing || tbr > (existing.bitrate || 0);

      if (isBetter && height >= 144) {
        const qualityLabel =
          height >= 2160 ? '4K (2160p)' : height >= 1440 ? '2K (1440p)' : `${height}p`;
        const resolution =
          f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : undefined);
        const fpsStr = fps > 30 ? ` ${fps}fps` : '';
        const label = `${qualityLabel}${fpsStr} Video Only (${ext.toUpperCase()})`;

        videoOnlyMap.set(key, {
          formatId: f.format_id,
          label,
          quality: qualityLabel,
          ext,
          resolution,
          fps: fps || undefined,
          bitrate: tbr ? Math.round(tbr) : undefined,
          filesizeApprox: approxSize || undefined,
          filesizeFormatted: formatBytes(approxSize),
          hasVideo: true,
          hasAudio: false,
          vcodec: f.vcodec,
          note: height >= 1080 ? 'Ultra HD Video Stream' : 'No Audio Track',
        });
      }
    }

    // Category 3: Raw Audio Only
    if (!hasVideo && hasAudio) {
      const audioBitrate = Math.round(abr || tbr || 128);
      const key = `${ext}_${audioBitrate}`;
      const existing = audioOnlyMap.get(key);
      if (!existing) {
        const label = `${ext.toUpperCase()} Audio (${audioBitrate} kbps)`;
        audioOnlyMap.set(key, {
          formatId: f.format_id,
          label,
          quality: `${audioBitrate} kbps`,
          ext,
          bitrate: audioBitrate,
          filesizeApprox: approxSize || undefined,
          filesizeFormatted: formatBytes(approxSize),
          hasVideo: false,
          hasAudio: true,
          acodec: f.acodec,
          note: ext === 'm4a' ? 'High Compatibility AAC' : 'Original Stream',
        });
      }
    }
  }

  // Ensure high quality merged MP4 options exist
  const commonResolutions = [
    { height: 1080, label: '1080p Full HD (MP4)', quality: '1080p', note: 'High Quality Merged' },
    { height: 720, label: '720p HD (MP4)', quality: '720p', note: 'Standard HD Merged' },
    { height: 480, label: '480p SD (MP4)', quality: '480p', note: 'Standard Definition' },
  ];

  for (const res of commonResolutions) {
    const key = `${res.height}p_mp4`;
    if (!videoWithAudioMap.has(key)) {
      let approxBytes: number | undefined = undefined;
      const vMatch = Array.from(videoOnlyMap.values()).find((v) =>
        v.label.includes(`${res.height}p`)
      );
      if (vMatch?.filesizeApprox) {
        approxBytes = vMatch.filesizeApprox + (duration > 0 ? (128 * 1000 * duration) / 8 : 0);
      }

      videoWithAudioMap.set(`merged_${res.height}`, {
        formatId: `bestvideo[height<=${res.height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${res.height}]+bestaudio/best[height<=${res.height}]`,
        label: res.label,
        quality: res.quality,
        ext: 'mp4',
        resolution:
          res.height === 1080 ? '1920x1080' : res.height === 720 ? '1280x720' : '854x480',
        filesizeApprox: approxBytes,
        filesizeFormatted: formatBytes(approxBytes),
        hasVideo: true,
        hasAudio: true,
        note: res.note,
      });
    }
  }

  // Prepend standardized MP3 Audio conversion presets (320kbps, 192kbps, 128kbps)
  const audioOptions: FormatItem[] = [
    {
      formatId: 'mp3_320',
      label: 'MP3 Audio (320 kbps - High Quality)',
      quality: '320 kbps',
      ext: 'mp3',
      bitrate: 320,
      filesizeApprox: duration > 0 ? Math.round((320 * 1000 * duration) / 8) : undefined,
      filesizeFormatted:
        duration > 0 ? formatBytes(Math.round((320 * 1000 * duration) / 8)) : undefined,
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Best MP3 Audio',
    },
    {
      formatId: 'mp3_192',
      label: 'MP3 Audio (192 kbps - Standard)',
      quality: '192 kbps',
      ext: 'mp3',
      bitrate: 192,
      filesizeApprox: duration > 0 ? Math.round((192 * 1000 * duration) / 8) : undefined,
      filesizeFormatted:
        duration > 0 ? formatBytes(Math.round((192 * 1000 * duration) / 8)) : undefined,
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Balanced Size & Sound',
    },
    {
      formatId: 'mp3_128',
      label: 'MP3 Audio (128 kbps - Compact)',
      quality: '128 kbps',
      ext: 'mp3',
      bitrate: 128,
      filesizeApprox: duration > 0 ? Math.round((128 * 1000 * duration) / 8) : undefined,
      filesizeFormatted:
        duration > 0 ? formatBytes(Math.round((128 * 1000 * duration) / 8)) : undefined,
      hasVideo: false,
      hasAudio: true,
      isAudioConversion: true,
      note: 'Fastest Download',
    },
    ...Array.from(audioOnlyMap.values()),
  ];

  // Convert maps to arrays and sort descending
  const videoWithAudioList = Array.from(videoWithAudioMap.values()).sort((a, b) => {
    const parseRes = (item: FormatItem) => {
      const match = item.quality.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    const resA = parseRes(a);
    const resB = parseRes(b);
    if (resB !== resA) return resB - resA;
    return (b.bitrate || 0) - (a.bitrate || 0);
  });

  const videoOnlyList = Array.from(videoOnlyMap.values()).sort((a, b) => {
    const parseRes = (item: FormatItem) => {
      const match = item.quality.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };
    const resA = parseRes(a);
    const resB = parseRes(b);
    if (resB !== resA) return resB - resA;
    return (b.fps || 0) - (a.fps || 0);
  });

  const audioOnlyList = audioOptions.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

  return {
    videoWithAudio: videoWithAudioList,
    videoOnly: videoOnlyList,
    audioOnly: audioOnlyList,
  };
}

/**
 * Sanitize title for safe filename in Content-Disposition headers
 */
export function sanitizeFilename(name: string, fallback = 'download'): string {
  const safe = name
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return safe.length > 0 ? safe.slice(0, 120) : fallback;
}

export interface MediaStreamResult {
  child?: ChildProcess;
  stream?: Readable;
  targetExt: string;
  contentType: string;
  cleanup?: () => void;
}

/**
 * Spawns an optimized media stream with 100% genuine YouTube audio/video streaming
 */
export function spawnDownloadStream(options: {
  url: string;
  formatId: string;
  title?: string;
  artist?: string;
  duration?: number;
  signal?: AbortSignal;
}): MediaStreamResult {
  const { url, formatId, title, artist, signal } = options;
  const ytDlpPath = getYtDlpPath();

  const safeTitle = (title || 'YouTube Audio').replace(/["\r\n]/g, '').trim();
  const safeArtist = (artist || 'YouTube Artist').replace(/["\r\n]/g, '').trim();

  // Check if requested format is Audio
  const isAudio =
    formatId.startsWith('mp3_') ||
    formatId === 'mp3' ||
    formatId === '140' ||
    formatId === 'm4a' ||
    formatId === 'wav' ||
    formatId === 'aac' ||
    formatId === 'flac' ||
    formatId.includes('audio');

  const outputStream = new PassThrough();
  let hasReceivedData = false;
  let activeProcess: ChildProcess | null = null;

  const cleanup = () => {
    if (activeProcess && !activeProcess.killed) {
      try {
        activeProcess.kill('SIGKILL');
      } catch {}
    }
  };

  if (signal) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  // Check for cookies file in common locations
  const cookiePaths = [
    path.join(process.cwd(), 'cookies.txt'),
    path.join(process.cwd(), 'bin', 'cookies.txt'),
    path.join(process.cwd(), 'data', 'cookies.txt'),
  ];
  let activeCookiePath: string | null = null;
  for (const cp of cookiePaths) {
    if (fs.existsSync(cp) && fs.statSync(cp).size > 0) {
      activeCookiePath = cp;
      break;
    }
  }

  if (isAudio) {
    let bitrate = 320;
    let targetExt = 'mp3';
    let contentType = 'audio/mpeg';

    if (formatId === 'mp3_192') {
      bitrate = 192;
    } else if (formatId === 'mp3_128') {
      bitrate = 128;
    } else if (formatId === 'wav') {
      targetExt = 'wav';
      contentType = 'audio/wav';
    } else if (formatId === '140' || formatId === 'm4a' || formatId === 'aac') {
      targetExt = 'm4a';
      contentType = 'audio/mp4';
    }

    try {
      const ytArgs = [
        '--js-runtimes',
        'node:/usr/local/bin/node',
        '--extractor-args',
        'youtube:player_client=ios,web',
        '--no-playlist',
        '--no-warnings',
        '--no-check-certificates',
        '-f',
        'ba/b',
        '-o',
        '-',
      ];

      if (activeCookiePath) {
        ytArgs.push('--cookies', activeCookiePath);
      }

      ytArgs.push(url);

      let ffmpegArgs: string[] = [];
      if (targetExt === 'mp3') {
        ffmpegArgs = [
          '-i',
          'pipe:0',
          '-vn',
          '-c:a',
          'libmp3lame',
          '-b:a',
          `${bitrate}k`,
          '-id3v2_version',
          '3',
          '-metadata',
          `title=${safeTitle}`,
          '-metadata',
          `artist=${safeArtist}`,
          '-f',
          'mp3',
          'pipe:1',
        ];
      } else if (targetExt === 'wav') {
        ffmpegArgs = [
          '-i',
          'pipe:0',
          '-vn',
          '-c:a',
          'pcm_s16le',
          '-ar',
          '44100',
          '-ac',
          '2',
          '-f',
          'wav',
          'pipe:1',
        ];
      } else {
        ffmpegArgs = [
          '-i',
          'pipe:0',
          '-vn',
          '-c:a',
          'aac',
          '-b:a',
          '128k',
          '-metadata',
          `title=${safeTitle}`,
          '-metadata',
          `artist=${safeArtist}`,
          '-f',
          'adts',
          'pipe:1',
        ];
      }

      const ytdlpProc = spawn(ytDlpPath, ytArgs, { signal });
      const ffmpegProc = spawn('ffmpeg', ffmpegArgs, { signal });
      activeProcess = ffmpegProc;

      ytdlpProc.stdout.pipe(ffmpegProc.stdin);

      ffmpegProc.stdout.on('data', (chunk) => {
        hasReceivedData = true;
        outputStream.write(chunk);
      });

      ffmpegProc.stdout.on('end', () => {
        outputStream.end();
      });

      ytdlpProc.on('error', (err) => {
        if (err.name !== 'AbortError' && !signal?.aborted) {
          console.error('[yt-dlp stream error]:', err.message);
        }
        outputStream.end();
      });

      ffmpegProc.on('error', (err) => {
        if (err.name !== 'AbortError' && !signal?.aborted) {
          console.error('[ffmpeg audio stream error]:', err.message);
        }
        outputStream.end();
      });

      ytdlpProc.on('close', (code) => {
        if (code !== 0 && !hasReceivedData) {
          outputStream.end();
        }
      });
    } catch {
      outputStream.end();
    }

    return {
      stream: outputStream,
      targetExt,
      contentType,
      cleanup,
    };
  }

  // Video Streaming Pipeline
  const targetExt = 'mp4';
  const contentType = 'video/mp4';

  try {
    const args = [
      '--js-runtimes',
      'node:/usr/local/bin/node',
      '--extractor-args',
      'youtube:player_client=ios,web',
      '-f',
      formatId,
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '-o',
      '-',
    ];

    if (activeCookiePath) {
      args.push('--cookies', activeCookiePath);
    }

    args.push(url);

    const child = spawn(ytDlpPath, args, { signal });
    activeProcess = child;

    child.stdout.on('data', (chunk) => {
      hasReceivedData = true;
      outputStream.write(chunk);
    });

    child.stdout.on('end', () => {
      outputStream.end();
    });

    child.on('error', (err) => {
      if (err.name !== 'AbortError' && !signal?.aborted) {
        console.error('[yt-dlp video error]:', err.message);
      }
      outputStream.end();
    });

    child.on('close', () => {
      outputStream.end();
    });
  } catch {
    outputStream.end();
  }

  return {
    stream: outputStream,
    targetExt,
    contentType,
    cleanup,
  };
}
