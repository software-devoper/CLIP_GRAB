/**
 * ClipGrab - Main Application Entry
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.js';
import { UrlInputForm } from './components/UrlInputForm.js';
import { VideoInfoCard } from './components/VideoInfoCard.js';
import { AudioPreviewPlayer } from './components/AudioPreviewPlayer.js';
import { FormatCategoryList } from './components/FormatCategoryList.js';
import { LoadingSkeleton } from './components/LoadingSkeleton.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { Footer } from './components/Footer.js';
import { VideoMetadata, GroupedFormats, FetchInfoResponse } from './types.js';
import { fetchMetadataClientSide } from './lib/clientExtractor.js';
import { DownloadCloud, Sparkles, Zap, Shield } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('clipgrab_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [formats, setFormats] = useState<GroupedFormats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<any>(null);

  // Sync dark mode class with document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('clipgrab_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('clipgrab_theme', 'light');
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleFetchInfo = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setMetadata(null);
    setFormats(null);
    setCurrentUrl(url);

    try {
      // First try the backend server API
      const res = await fetch('/api/fetch-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const data: FetchInfoResponse = await res.json();
        if (data.success) {
          setMetadata(data.metadata);
          setFormats(data.formats);
          return;
        }
      }

      // If backend responded with 404 or failed on static host (e.g. Vercel), fallback to client extractor
      console.info('Backend /api/fetch-info not reachable or returned error, engaging client-side fallback engine...');
      const fallbackResult = await fetchMetadataClientSide(url);
      setMetadata(fallbackResult.metadata);
      setFormats(fallbackResult.formats);
    } catch (err: any) {
      try {
        // Double fallback if fetch thrown network exception
        const fallbackResult = await fetchMetadataClientSide(url);
        setMetadata(fallbackResult.metadata);
        setFormats(fallbackResult.formats);
      } catch (fallbackErr: any) {
        setError(
          fallbackErr.message || 'Failed to extract video information. Please ensure the link is a valid YouTube URL.'
        );
        setErrorCode('INVALID_URL');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <Navbar darkMode={darkMode} onToggleDarkMode={handleToggleDarkMode} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 space-y-10">
        {/* Hero Section with Bold Industrial Typography */}
        <section className="text-left sm:text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 rounded-md border border-red-200/60 dark:border-red-800/40">
            <Zap className="w-3.5 h-3.5" />
            <span>yt-dlp Core 2024 • FFmpeg Pipeline</span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[96px] font-black leading-[0.85] tracking-[-0.05em] uppercase italic text-zinc-950 dark:text-white">
            CLIP<span className="text-red-600">GRAB</span>
          </h1>

          <p className="text-zinc-500 uppercase tracking-[0.25em] text-xs font-mono font-semibold">
            Professional Media Extraction Utility / v4.2.0
          </p>

          <p className="max-w-2xl sm:mx-auto text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans pt-1">
            Stateless direct media extraction with chunked streaming. Download 4K, 1080p, 720p MP4 or convert audio to 320kbps MP3 on-the-fly. Zero server storage.
          </p>
        </section>

        {/* URL Input Form */}
        <section>
          <UrlInputForm
            onSubmit={handleFetchInfo}
            isLoading={isLoading}
            initialUrl={currentUrl}
          />
        </section>

        {/* Results Area */}
        <section className="space-y-6">
          {/* Error Banner */}
          {error && (
            <ErrorMessage
              error={error}
              errorCode={errorCode}
              onRetry={() => currentUrl && handleFetchInfo(currentUrl)}
            />
          )}

          {/* Loading Skeleton */}
          {isLoading && <LoadingSkeleton />}

          {/* Extracted Video Information and Format Categories */}
          {metadata && formats && !isLoading && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <VideoInfoCard metadata={metadata} />
              <AudioPreviewPlayer metadata={metadata} videoUrl={currentUrl} />
              <FormatCategoryList
                formats={formats}
                videoUrl={currentUrl}
                videoTitle={metadata.title}
              />
            </div>
          )}

          {/* Empty / Initial State features overview */}
          {!metadata && !isLoading && !error && (
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 shadow-sm group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block">
                  [ 01 // FORMAT ]
                </span>
                <h3 className="font-black text-sm uppercase tracking-tight text-zinc-950 dark:text-zinc-100">
                  Video + Audio Merged
                </h3>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  1080p Full HD, 720p HD, and 480p standard MP4 files ready to play anywhere.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 shadow-sm group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block">
                  [ 02 // AUDIO ]
                </span>
                <h3 className="font-black text-sm uppercase tracking-tight text-zinc-950 dark:text-zinc-100">
                  Crystal Clear MP3
                </h3>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Instant conversion to 320 kbps, 192 kbps, and 128 kbps MP3 files or original AAC/M4A.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 shadow-sm group hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500 block">
                  [ 03 // PIPELINE ]
                </span>
                <h3 className="font-black text-sm uppercase tracking-tight text-zinc-950 dark:text-zinc-100">
                  Zero Disk Retention
                </h3>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No queue, no file storage limits, and direct piping to your browser download manager.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
