import React from 'react';
import { VideoMetadata } from '../types.js';
import { Clock, Eye, Calendar, ExternalLink, Play, CheckCircle2 } from 'lucide-react';

interface VideoInfoCardProps {
  metadata: VideoMetadata;
}

export const VideoInfoCard: React.FC<VideoInfoCardProps> = ({ metadata }) => {
  return (
    <div
      id="video-info-card"
      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl transition-all"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Thumbnail Preview with Play Accent */}
        <div className="relative w-full lg:w-72 lg:min-w-[18rem] aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex-shrink-0 group">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-mono">
              [ NO PREVIEW ]
            </div>
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Central Play Accent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-red-600/25 border border-red-600/50 flex items-center justify-center backdrop-blur-xs group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-red-500 fill-red-500 ml-0.5" />
            </div>
          </div>

          {/* Duration Badge */}
          {metadata.durationFormatted && (
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded bg-black/90 text-white font-mono text-[11px] font-bold tracking-wider flex items-center gap-1 border border-zinc-800">
              <Clock className="w-3 h-3 text-red-500" />
              <span>{metadata.durationFormatted}</span>
            </div>
          )}
        </div>

        {/* Video Details */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Massive Bold Title */}
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white leading-tight uppercase tracking-tight">
              {metadata.title}
            </h2>

            {/* Channel & Stats row */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-200">
                <span className="truncate">{metadata.channel}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-red-600 fill-red-600/10 flex-shrink-0" />
              </div>

              {metadata.viewCountFormatted && (
                <>
                  <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-700 rounded-full"></span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">
                    {metadata.viewCountFormatted}
                  </span>
                </>
              )}

              {metadata.uploadDate && (
                <>
                  <span className="w-1 h-1 bg-zinc-400 dark:bg-zinc-700 rounded-full"></span>
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    {metadata.uploadDate}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Technical Telemetry Footer inside info card */}
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 dark:text-zinc-500 mb-0.5">
                Output Destination
              </p>
              <p className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                Direct Browser Stream / Edge Proxy
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase tracking-widest font-mono text-zinc-400 dark:text-zinc-500 mb-0.5">
                  Extraction Engine
                </p>
                <p className="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-300">
                  yt-dlp core + FFmpeg
                </p>
              </div>

              <a
                href={metadata.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
              >
                <span>YouTube</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

