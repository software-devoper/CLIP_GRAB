import React, { useState } from 'react';
import {
  Download,
  Play,
  Pause,
  Music,
  Video,
  Film,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Share2,
  Volume2,
  HardDriveDownload,
  Layers,
} from 'lucide-react';
import { VideoMetadata, GroupedFormats, FormatItem } from '../types.js';
import { executeMediaDownload, DownloadProgress } from '../lib/downloadEngine.js';
import { extractYouTubeVideoId } from '../lib/clientExtractor.js';
import { AudioPreviewPlayer } from './AudioPreviewPlayer.js';

interface SaveFromResultCardProps {
  metadata: VideoMetadata;
  formats: GroupedFormats;
  videoUrl: string;
}

export const SaveFromResultCard: React.FC<SaveFromResultCardProps> = ({
  metadata,
  formats,
  videoUrl,
}) => {
  // Determine default selected format (prefers 720p or 1080p video with audio)
  const defaultFormat =
    formats.videoWithAudio.find((f) => f.formatId.includes('720')) ||
    formats.videoWithAudio[0] ||
    formats.audioOnly[0];

  const [selectedFormat, setSelectedFormat] = useState<FormatItem>(defaultFormat);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'all'>('video');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showMirrorOptions, setShowMirrorOptions] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const videoId = metadata.id || extractYouTubeVideoId(videoUrl) || '';

  const handleDownload = (formatToDownload?: FormatItem) => {
    const fmt = formatToDownload || selectedFormat;
    if (!fmt) return;

    setIsDownloading(true);
    setDownloadSuccess(false);
    setShowMirrorOptions(false);
    setProgress({
      percent: 5,
      receivedBytes: 0,
      speed: 'Connecting...',
      formattedReceived: '0 MB',
      formattedTotal: fmt.filesizeFormatted || 'Calculating...',
      status: 'preparing',
    });

    const isMp3 = fmt.ext === 'mp3' || fmt.isAudioConversion;

    executeMediaDownload({
      videoUrl,
      formatId: fmt.formatId,
      ext: fmt.ext,
      videoTitle: metadata.title,
      filesizeApprox: fmt.filesizeApprox,
      artist: metadata.channel,
      duration: metadata.duration,
      onProgress: (p) => setProgress(p),
      onComplete: () => {
        setIsDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => {
          setProgress(null);
          setDownloadSuccess(false);
        }, 4000);
      },
      onError: () => {
        setIsDownloading(false);
        setShowMirrorOptions(true);
        setTimeout(() => setProgress(null), 2500);
      },
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(videoUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      id="savefrom-result-card"
      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl transition-all space-y-6"
    >
      {/* Top Banner: Video Thumbnail + Info + Primary SaveFrom Green Download Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left: Thumbnail Preview */}
        <div className="relative w-full lg:w-80 aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex-shrink-0 group">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 font-mono text-xs">
              No Preview
            </div>
          )}

          {/* Central Play Accent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 group-hover:bg-black/10 transition-colors">
            <div className="w-12 h-12 rounded-full bg-emerald-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          {metadata.durationFormatted && (
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/85 text-white font-mono text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{metadata.durationFormatted}</span>
            </div>
          )}
        </div>

        {/* Center & Right: Title, Channel, & Big Green Download Controls */}
        <div className="flex-1 w-full flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white leading-snug">
              {metadata.title}
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                <span>{metadata.channel}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10 shrink-0" />
              </div>

              {metadata.viewCountFormatted && (
                <>
                  <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                  <span className="font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{metadata.viewCountFormatted}</span>
                  </span>
                </>
              )}

              <a
                href={metadata.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 underline ml-auto"
              >
                <span>View on YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* SaveFrom Signature Main Download Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Green Download Button with dropdown trigger */}
            <div className="relative flex-1 flex rounded-xl shadow-md">
              <button
                id="main-download-btn"
                onClick={() => handleDownload()}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-l-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm sm:text-base transition-all active:scale-[0.99] disabled:opacity-75"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Preparing Stream...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>Download Ready!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download {selectedFormat?.quality || 'MP4 720p'}</span>
                  </>
                )}
              </button>

              {/* Format Dropdown Toggle */}
              <button
                id="toggle-format-dropdown"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="px-3.5 py-3.5 rounded-r-xl bg-emerald-700 hover:bg-emerald-800 text-white border-l border-emerald-500/40 transition-colors flex items-center justify-center"
                title="Choose format and quality"
              >
                {isDropdownOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl text-xs font-semibold border transition-colors ${
                  showAudioPlayer
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
                title="Preview Audio Player"
              >
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>Audio Player</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
                title="Copy Link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar Display when downloading */}
      {progress && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-emerald-900 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>{progress.speed || 'Downloading media chunk...'}</span>
            </span>
            <span className="font-mono font-bold">{progress.percent}%</span>
          </div>

          <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, progress.percent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
            <span>Received: {progress.formattedReceived}</span>
            <span>Total: {progress.formattedTotal}</span>
          </div>
        </div>
      )}

      {/* Fallback Direct High Speed Mirrors if YouTube Bot Verification blocks cloud IP */}
      {showMirrorOptions && videoId && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>YouTube requires client verification. Choose high-speed direct download mirror:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`https://ssyoutube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <span>SaveFrom Direct</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href={`https://www.y2mate.com/youtube/${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <span>Y2Mate MP3/MP4</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="https://cobalt.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              <span>Cobalt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Embedded Audio Preview Player */}
      {showAudioPlayer && (
        <div className="pt-2 animate-in fade-in-50 duration-300">
          <AudioPreviewPlayer metadata={metadata} videoUrl={videoUrl} />
        </div>
      )}

      {/* SaveFrom Format Selection Table / Dropdown Menu */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-emerald-500" />
              <span>Available Formats & Resolutions</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Select any format to download immediately
            </p>
          </div>

          {/* Format Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'video'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video ({formats.videoWithAudio.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'audio'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio ({formats.audioOnly.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All</span>
            </button>
          </div>
        </div>

        {/* Formats Table */}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/40">
          {/* Video Formats */}
          {(activeTab === 'video' || activeTab === 'all') && (
            <div>
              <div className="bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-emerald-500" />
                <span>Video MP4 (with audio)</span>
              </div>
              <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {formats.videoWithAudio.map((fmt) => (
                  <div
                    key={fmt.formatId}
                    className={`px-4 py-3 flex items-center justify-between gap-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${
                      selectedFormat?.formatId === fmt.formatId
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 px-2 py-0.5 text-center text-xs font-bold font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800">
                        {fmt.quality}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>MP4 Video</span>
                          {fmt.note && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                              {fmt.note}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {fmt.filesizeFormatted || 'Auto'} • {fmt.hasAudio ? 'Sound Included' : 'No Sound'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFormat(fmt);
                          handleDownload(fmt);
                        }}
                        disabled={isDownloading}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Formats */}
          {(activeTab === 'audio' || activeTab === 'all') && (
            <div>
              <div className="bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-emerald-500" />
                <span>Audio MP3 & M4A</span>
              </div>
              <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {formats.audioOnly.map((fmt) => (
                  <div
                    key={fmt.formatId}
                    className={`px-4 py-3 flex items-center justify-between gap-4 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors ${
                      selectedFormat?.formatId === fmt.formatId
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 px-2 py-0.5 text-center text-xs font-bold font-mono bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                        {fmt.quality}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{fmt.ext.toUpperCase()} Audio</span>
                          {fmt.note && (
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                              {fmt.note}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {fmt.filesizeFormatted || 'Approx 8 MB'} • High Bitrate
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedFormat(fmt);
                          handleDownload(fmt);
                        }}
                        disabled={isDownloading}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ultra HD DASH streams */}
          {activeTab === 'all' && formats.videoOnly?.length > 0 && (
            <div>
              <div className="bg-zinc-100 dark:bg-zinc-800/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <Film className="w-3.5 h-3.5 text-purple-500" />
                <span>Ultra HD Streams (4K / 2K Video Only)</span>
              </div>
              <div className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                {formats.videoOnly.map((fmt) => (
                  <div
                    key={fmt.formatId}
                    className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-14 px-2 py-0.5 text-center text-xs font-bold font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded">
                        {fmt.quality}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {fmt.resolution || 'Ultra HD'} DASH Stream
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          {fmt.filesizeFormatted || 'Large file'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(fmt)}
                      disabled={isDownloading}
                      className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
