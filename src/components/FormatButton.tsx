import React, { useState } from 'react';
import {
  Download,
  Loader2,
  Music,
  Video,
  Sparkles,
  Copy,
  CheckCircle2,
  Check,
  ArrowDownToLine,
  ExternalLink,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { FormatItem } from '../types.js';
import { executeMediaDownload, DownloadProgress } from '../lib/downloadEngine.js';
import { extractYouTubeVideoId } from '../lib/clientExtractor.js';

interface FormatButtonProps {
  format: FormatItem;
  videoUrl: string;
  videoTitle: string;
  duration?: number;
  artist?: string;
}

export const FormatButton: React.FC<FormatButtonProps> = ({
  format,
  videoUrl,
  videoTitle,
  duration,
  artist,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMirrorOptions, setShowMirrorOptions] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  const videoId = extractYouTubeVideoId(videoUrl) || '';

  const getDownloadUrl = () => {
    const params = new URLSearchParams({
      url: videoUrl,
      formatId: format.formatId,
      title: videoTitle,
      artist: artist || 'ClipGrab',
      duration: String(duration || 180),
      ext: format.ext,
    });
    return `/api/download?${params.toString()}`;
  };

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setDownloadSuccess(false);
    setShowMirrorOptions(false);
    setProgress({
      percent: 5,
      receivedBytes: 0,
      totalBytes: format.filesizeApprox || 0,
      speed: 'Starting stream...',
      formattedReceived: '0 MB',
      formattedTotal: format.filesizeFormatted || 'Calculating...',
      status: 'preparing',
    });

    await executeMediaDownload({
      videoUrl,
      formatId: format.formatId,
      videoTitle,
      artist,
      duration,
      ext: format.ext,
      filesizeApprox: format.filesizeApprox,
      onProgress: (p) => {
        setProgress(p);
      },
      onComplete: () => {
        setIsDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => {
          setDownloadSuccess(false);
          setProgress(null);
        }, 3500);
      },
      onError: () => {
        setIsDownloading(false);
        setShowMirrorOptions(true);
        setTimeout(() => setProgress(null), 2500);
      },
    });
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = `${window.location.origin}${getDownloadUrl()}`;
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignore
    }
  };

  const isRecommended =
    format.note?.includes('Recommended') ||
    format.formatId.includes('320') ||
    format.formatId.includes('1080');

  return (
    <div
      id={`format-card-${format.formatId.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
      className={`group flex flex-col p-4 rounded-xl transition-all border ${
        isRecommended
          ? 'bg-red-50/30 dark:bg-zinc-900/90 border-red-200 dark:border-red-900/40 shadow-xs'
          : 'bg-white dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        {/* Format Information Left Side */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${
              format.hasVideo
                ? 'bg-red-500/10 text-red-600 dark:text-red-500 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {format.hasVideo ? <Video className="w-5 h-5" /> : <Music className="w-5 h-5" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bold Monospace Quality Badge */}
              <span className="font-mono font-black text-sm sm:text-base text-zinc-950 dark:text-zinc-100 tracking-tight">
                {format.quality}
              </span>

              {/* Format extension tag */}
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                {format.ext.toUpperCase()}
              </span>

              {/* Note badge */}
              {format.note && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800/50">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{format.note}</span>
                </span>
              )}
            </div>

            {/* Technical Specs row */}
            <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              {format.resolution && <span>{format.resolution}</span>}
              {format.fps && <span>• {format.fps} FPS</span>}
              {format.bitrate && <span>• {format.bitrate} kbps</span>}
              {format.acodec && <span>• {format.acodec}</span>}
            </div>
          </div>
        </div>

        {/* Right Side: File Size Pill & Download Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          {/* File Size Badge */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Est. Size</span>
            <span className="text-xs sm:text-sm font-mono font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              {format.filesizeFormatted || 'Calculating...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct Stream Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Direct Stream Link"
              aria-label="Copy Direct Stream Link"
              className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Professional Download Action Button */}
            <button
              id={`download-btn-${format.formatId.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`min-w-[130px] sm:min-w-[145px] flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 ${
                isDownloading
                  ? 'bg-zinc-800 dark:bg-zinc-700 text-white cursor-wait'
                  : downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
              }`}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{progress ? `${progress.percent}%` : 'DOWNLOADING'}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>COMPLETE</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4 stroke-[2.5]" />
                  <span>DOWNLOAD</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Progress Bar & Download Telemetry */}
      {isDownloading && progress && (
        <div className="mt-3.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 space-y-2 animate-fadeIn">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>
                {progress.status === 'packaging'
                  ? 'Finalizing container...'
                  : progress.status === 'preparing'
                  ? 'Connecting to stream...'
                  : `Downloading: ${progress.formattedReceived} / ${progress.formattedTotal}`}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {progress.speed && (
                <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-bold text-[10px]">
                  {progress.speed}
                </span>
              )}
              <span className="font-black text-red-600 dark:text-red-400">{progress.percent}%</span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-300/40 dark:border-zinc-700/50">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Instant Mirror Fallback Options if YouTube Cloud IP Rate Limit Triggers */}
      {showMirrorOptions && videoId && (
        <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>YouTube requires direct download client. Choose high-speed mirror:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://www.y2mate.com/youtube/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-600 text-white font-mono text-[11px] font-bold hover:bg-red-500 transition-colors"
            >
              <span>Y2Mate MP3/MP4</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={`https://ssyoutube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-white font-mono text-[11px] font-bold hover:bg-zinc-700 transition-colors"
            >
              <span>SaveFrom</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://cobalt.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 text-white font-mono text-[11px] font-bold hover:bg-purple-500 transition-colors"
            >
              <span>Cobalt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
