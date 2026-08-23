/**
 * Type definitions for ClipGrab YouTube downloader
 */

export interface VideoMetadata {
  id: string;
  title: string;
  channel: string;
  channelUrl?: string;
  duration: number; // in seconds
  durationFormatted: string; // e.g. "04:12" or "01:23:45"
  thumbnail: string;
  viewCount?: number;
  viewCountFormatted?: string; // e.g. "1.2M views"
  uploadDate?: string; // e.g. "2024-03-15"
  description?: string;
  originalUrl: string;
}

export type FormatCategory = 'videoWithAudio' | 'videoOnly' | 'audioOnly';

export interface FormatItem {
  formatId: string;
  label: string; // e.g. "1080p Full HD (MP4)" or "320 kbps High Quality (MP3)"
  quality: string; // e.g. "1080p", "720p", "320 kbps", "128 kbps"
  ext: string; // "mp4", "webm", "mp3", "m4a", "opus"
  resolution?: string; // "1920x1080"
  fps?: number;
  bitrate?: number; // kbps
  filesizeApprox?: number; // bytes
  filesizeFormatted?: string; // "45.2 MB"
  hasVideo: boolean;
  hasAudio: boolean;
  isAudioConversion?: boolean; // If converted to MP3 via ffmpeg
  vcodec?: string;
  acodec?: string;
  note?: string; // e.g. "Recommended", "Standard", "Lossless"
}

export interface GroupedFormats {
  videoWithAudio: FormatItem[];
  videoOnly: FormatItem[];
  audioOnly: FormatItem[];
}

export interface FetchInfoSuccessResponse {
  success: true;
  metadata: VideoMetadata;
  formats: GroupedFormats;
}

export interface FetchInfoErrorResponse {
  success: false;
  error: string;
  errorCode:
    | 'INVALID_URL'
    | 'VIDEO_NOT_FOUND'
    | 'AGE_RESTRICTED'
    | 'GEO_RESTRICTED'
    | 'RATE_LIMITED'
    | 'TIMEOUT'
    | 'SERVER_ERROR';
  details?: string;
}

export type FetchInfoResponse = FetchInfoSuccessResponse | FetchInfoErrorResponse;
