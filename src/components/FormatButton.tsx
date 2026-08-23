import React, { useState } from 'react';
import { Download, Loader2, Check, Music, Video, Sparkles, Copy } from 'lucide-react';
import { FormatItem } from '../types.js';

interface FormatButtonProps {
  format: FormatItem;
  videoUrl: string;
  videoTitle: string;
}

export const FormatButton: React.FC<FormatButtonProps> = ({ format, videoUrl, videoTitle }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getDownloadUrl = () => {
    const params = new URLSearchParams({
      url: videoUrl,
      formatId: format.formatId,
      title: videoTitle,
      ext: format.ext,
    });
    return `/api/download?${params.toString()}`;
  };

  const handleDownload = () => {
    setIsDownloading(true);
    const downloadUrl = getDownloadUrl();

    // Trigger standard browser download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${videoTitle}.${format.ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Reset spinner after trigger delay
    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
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

  const isAudio = !format.hasVideo && format.hasAudio;
  const isHighRes = format.quality.includes('4K') || format.quality.includes('2K') || format.quality.includes('1080');

  return (
    <div
      id={`format-card-${format.formatId.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-all ${
        format.note?.includes('Recommended') || format.formatId.includes('320')
          ? 'border-l-4 border-l-red-600 dark:border-l-red-500'
          : ''
      }`}
    >
      {/* Format Information */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 flex items-center justify-center text-zinc-700 dark:text-zinc-300 flex-shrink-0 shadow-xs">
          {format.hasVideo ? (
            <Video className="w-4 h-4 text-red-600 dark:text-red-500" />
          ) : (
            <Music className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bold Monospace Quality Badge */}
            <span className="font-mono font-bold text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 uppercase tracking-tight">
              {format.quality} {format.ext.toUpperCase()}
            </span>

            {/* Note badge */}
            {format.note && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded border border-red-200/60 dark:border-red-800/40">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{format.note}</span>
              </span>
            )}
          </div>

          {/* Technical Specs row */}
          <div className="mt-1 flex items-center gap-2.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            {format.resolution && <span>{format.resolution}</span>}
            {format.fps && <span>• {format.fps}fps</span>}
            {format.bitrate && <span>• {format.bitrate}kbps</span>}
          </div>
        </div>
      </div>

      {/* Right Side: File Size Pill & Download Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200/60 dark:border-zinc-800">
        {/* Monospace File Size Badge */}
        {format.filesizeFormatted && (
          <span className="text-[10px] sm:text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-200/70 dark:bg-zinc-950 text-zinc-700 dark:text-zinc-400 border border-zinc-300/60 dark:border-zinc-800">
            {format.filesizeFormatted}
          </span>
        )}

        <div className="flex items-center gap-2">
          {/* Direct Stream Copy Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            title="Copy Direct Stream Link"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Bold Download Action Button */}
          <button
            id={`download-btn-${format.formatId.replace(/[^a-zA-Z0-9_-]/g, '_')}`}
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-tight rounded-lg text-white transition-all shadow-xs ${
              isDownloading
                ? 'bg-zinc-700 cursor-wait'
                : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-red-600 dark:hover:bg-red-700 active:scale-98'
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono text-[10px]">Streaming</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

