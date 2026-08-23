/**
 * Professional Direct & Streaming Media Downloader Engine
 * Tracks exact byte streams, calculates download speed, updates progress bars,
 * and maintains spinner states until file transfer is 100% complete.
 */

import { formatBytes } from './clientExtractor.js';

export interface DownloadProgress {
  percent: number; // 0 - 100
  receivedBytes: number;
  totalBytes: number;
  speed: string; // e.g. "2.4 MB/s"
  formattedReceived: string; // e.g. "14.2 MB"
  formattedTotal: string; // e.g. "45.0 MB"
  status: 'preparing' | 'downloading' | 'packaging' | 'completed' | 'error';
}

export interface DownloadTriggerOptions {
  videoUrl: string;
  formatId: string;
  videoTitle: string;
  ext: string;
  artist?: string;
  duration?: number;
  filesizeApprox?: number;
  onStart?: () => void;
  onProgress?: (progress: DownloadProgress) => void;
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
  filesizeApprox,
  onStart,
  onProgress,
  onComplete,
  onError,
}: DownloadTriggerOptions): Promise<void> {
  if (onStart) onStart();

  const safeTitle = (videoTitle || 'media_download')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .trim()
    .slice(0, 80);

  const cleanExt = (ext || 'mp4').toLowerCase().replace(/^\./, '');
  const filename = `${safeTitle}.${cleanExt}`;

  // Estimate total bytes if not explicitly provided
  let estimatedTotalBytes = filesizeApprox || 0;
  if (!estimatedTotalBytes || estimatedTotalBytes <= 0) {
    if (formatId.includes('320')) {
      estimatedTotalBytes = Math.round((320 * 1000 * duration) / 8);
    } else if (formatId.includes('192')) {
      estimatedTotalBytes = Math.round((192 * 1000 * duration) / 8);
    } else if (formatId.includes('128') || formatId === '140') {
      estimatedTotalBytes = Math.round((128 * 1000 * duration) / 8);
    } else if (formatId.includes('1080')) {
      estimatedTotalBytes = Math.round((4500 * 1000 * duration) / 8);
    } else if (formatId.includes('720')) {
      estimatedTotalBytes = Math.round((2200 * 1000 * duration) / 8);
    } else if (formatId.includes('480')) {
      estimatedTotalBytes = Math.round((1100 * 1000 * duration) / 8);
    } else {
      estimatedTotalBytes = Math.round((600 * 1000 * duration) / 8);
    }
  }

  // Initial progress update
  if (onProgress) {
    onProgress({
      percent: 5,
      receivedBytes: 0,
      totalBytes: estimatedTotalBytes,
      speed: 'Connecting to stream...',
      formattedReceived: '0 MB',
      formattedTotal: formatBytes(estimatedTotalBytes),
      status: 'preparing',
    });
  }

  const params = new URLSearchParams({
    url: videoUrl,
    formatId,
    title: videoTitle,
    artist,
    duration: String(duration),
    ext: cleanExt,
  });

  const downloadEndpoint = `/api/download?${params.toString()}`;

  // Streaming fetch with progress monitoring
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout for high quality media
    const response = await fetch(downloadEndpoint, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Download stream failed.');
      throw new Error(errText || `HTTP Error ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No readable data stream received from server.');
    }

    const contentLengthHeader = response.headers.get('content-length');
    const realTotalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : estimatedTotalBytes;
    const targetTotal = realTotalBytes > 0 ? realTotalBytes : estimatedTotalBytes;

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    let startTime = performance.now();
    let lastSpeedCalcTime = startTime;
    let lastSpeedCalcBytes = 0;
    let currentSpeed = 'Calculating...';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        chunks.push(value);
        receivedBytes += value.byteLength;

        const now = performance.now();
        const timeDiff = (now - lastSpeedCalcTime) / 1000;
        if (timeDiff >= 0.25) {
          const bytesDiff = receivedBytes - lastSpeedCalcBytes;
          const speedBps = bytesDiff / timeDiff;
          currentSpeed = `${formatBytes(speedBps)}/s`;
          lastSpeedCalcTime = now;
          lastSpeedCalcBytes = receivedBytes;
        }

        const effectiveTotal = Math.max(targetTotal, receivedBytes);
        const rawPercent = Math.min(95, Math.round((receivedBytes / effectiveTotal) * 100));
        const currentPercent = Math.max(10, rawPercent);

        if (onProgress) {
          onProgress({
            percent: currentPercent,
            receivedBytes,
            totalBytes: effectiveTotal,
            speed: currentSpeed,
            formattedReceived: formatBytes(receivedBytes),
            formattedTotal: formatBytes(effectiveTotal),
            status: 'downloading',
          });
        }
      }
    }

    if (receivedBytes === 0) {
      throw new Error('Empty stream received from YouTube.');
    }

    // Packaging phase
    if (onProgress) {
      onProgress({
        percent: 98,
        receivedBytes,
        totalBytes: receivedBytes,
        speed: 'Finalizing...',
        formattedReceived: formatBytes(receivedBytes),
        formattedTotal: formatBytes(receivedBytes),
        status: 'packaging',
      });
    }

    // Create Blob and trigger browser download
    const mimeType = response.headers.get('content-type') || (cleanExt === 'mp3' ? 'audio/mpeg' : cleanExt === 'wav' ? 'audio/wav' : 'video/mp4');
    const blob = new Blob(chunks, { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 5000);

    if (onProgress) {
      onProgress({
        percent: 100,
        receivedBytes,
        totalBytes: receivedBytes,
        speed: 'Complete',
        formattedReceived: formatBytes(receivedBytes),
        formattedTotal: formatBytes(receivedBytes),
        status: 'completed',
      });
    }

    if (onComplete) onComplete();
  } catch (err: any) {
    console.error('Download execution error:', err);
    if (onProgress) {
      onProgress({
        percent: 0,
        receivedBytes: 0,
        totalBytes: estimatedTotalBytes,
        speed: 'Failed',
        formattedReceived: '0 MB',
        formattedTotal: formatBytes(estimatedTotalBytes),
        status: 'error',
      });
    }
    if (onError) onError(err instanceof Error ? err : new Error(String(err)));
    if (onComplete) onComplete();
  }
}
