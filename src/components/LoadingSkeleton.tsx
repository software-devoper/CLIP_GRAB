import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div id="loading-skeleton" className="w-full space-y-6">
      {/* Loading telemetry notification */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono">
        <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-200 font-bold uppercase tracking-wider">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>Extracting stream manifest via yt-dlp...</span>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono hidden sm:inline">
          [ PROBING DASH & PROGRESSIVE MATRIX ]
        </span>
      </div>

      {/* Video Card Skeleton */}
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 animate-pulse">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail Skeleton */}
          <div className="w-full lg:w-72 aspect-video bg-zinc-200 dark:bg-zinc-800 rounded-xl flex-shrink-0" />

          {/* Text Skeletons */}
          <div className="flex-1 space-y-4 py-1">
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/3" />
            <div className="flex gap-3 pt-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-24" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-28" />
            </div>
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-32" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-12 bg-zinc-200/70 dark:bg-zinc-800/70 rounded-xl animate-pulse" />

      {/* Format Items Skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 animate-pulse">
        <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40 mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        ))}
      </div>
    </div>
  );
};

