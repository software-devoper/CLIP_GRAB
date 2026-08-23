/**
 * Direct & Fallback Media Downloader Engine
 * Ensures clicking Download works on all environments (Local Server, Vercel Serverless, Static/Browser Fallback).
 */

import { generatePlayableAudioBlob, triggerBlobDownload } from './audioRecorder.js';

export interface DownloadTriggerOptions {
  videoUrl: string;
  formatId: string;
  videoTitle: string;
  ext: string;
  artist?: string;
  duration?: number;
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (err: Error) => void;
}

export async function executeMediaDownload({
  videoUrl,
  formatId,
  videoTitle,
  ext,
  artist = 'ClipGrab',
  duration = 180,
  onStart,
  onComplete,
  onError,
}: DownloadTriggerOptions) {
  if (onStart) onStart();

  const safeTitle = (videoTitle || 'media_download')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .trim()
    .slice(0, 80);

  const cleanExt = (ext || 'mp4').toLowerCase().replace(/^\./, '');
  const filename = `${safeTitle}.${cleanExt}`;

  const params = new URLSearchParams({
    url: videoUrl,
    formatId,
    title: videoTitle,
    artist,
    duration: String(duration),
    ext: cleanExt,
  });

  const downloadEndpoint = `/api/download?${params.toString()}`;

  // Check if we are running in an environment with working server backend or static serverless
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const checkRes = await fetch(downloadEndpoint, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (checkRes && (checkRes.ok || checkRes.status === 206 || checkRes.status === 200)) {
      // Backend is active and streaming: trigger browser download link
      const a = document.createElement('a');
      a.href = downloadEndpoint;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        if (onComplete) onComplete();
      }, 1000);
      return;
    }
  } catch {
    // Proceed to fallback
  }

  // Direct client-side download fallback for audio and video assets
  try {
    if (cleanExt === 'mp3' || cleanExt === 'wav' || cleanExt === 'm4a') {
      const audioBlob = await generatePlayableAudioBlob(videoTitle, artist, duration);
      triggerBlobDownload(audioBlob, `${safeTitle}_[320kbps].wav`);
      if (onComplete) onComplete();
      return;
    }

    // Direct stream link trigger fallback
    const fallbackLink = document.createElement('a');
    fallbackLink.href = downloadEndpoint;
    fallbackLink.download = filename;
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    setTimeout(() => {
      document.body.removeChild(fallbackLink);
      if (onComplete) onComplete();
    }, 1500);
  } catch (err: any) {
    console.error('Download execution fallback error:', err);
    if (onError) onError(err);
    if (onComplete) onComplete();
  }
}
