/**
 * YouTube URL validators and helper utilities
 */

// Regular expressions to match all YouTube URL formats
const YOUTUBE_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|v\/|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?$/;

/**
 * Validates whether a given string is a valid YouTube video URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return YOUTUBE_REGEX.test(trimmed);
}

/**
 * Extracts the 11-character YouTube video ID from a URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  const match = trimmed.match(YOUTUBE_REGEX);
  return match && match[1] ? match[1] : null;
}

/**
 * Normalizes any YouTube URL to canonical format: https://www.youtube.com/watch?v=VIDEO_ID
 */
export function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url.trim();
}
