import React, { useState, useEffect } from 'react';
import {
  Download,
  Clipboard,
  X,
  ArrowRight,
  Loader2,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Music,
  Video,
  Sparkles,
  Check,
  Zap,
  Flame,
} from 'lucide-react';
import { isValidYouTubeUrl } from '../lib/validators.js';

interface SaveFromHeroProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  initialUrl?: string;
  activePlatform?: string;
}

const SUPPORTED_PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: 'youtube', color: 'text-red-500', bg: 'hover:border-red-400' },
  { id: 'instagram', name: 'Instagram', icon: 'instagram', color: 'text-pink-500', bg: 'hover:border-pink-400' },
  { id: 'tiktok', name: 'TikTok', icon: 'tiktok', color: 'text-cyan-400', bg: 'hover:border-cyan-400' },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', color: 'text-blue-600', bg: 'hover:border-blue-400' },
  { id: 'twitter', name: 'Twitter / X', icon: 'twitter', color: 'text-zinc-700 dark:text-zinc-300', bg: 'hover:border-zinc-400' },
  { id: 'soundcloud', name: 'SoundCloud', icon: 'music', color: 'text-orange-500', bg: 'hover:border-orange-400' },
];

const SAMPLE_URLS = [
  { label: 'Serhat Durmus - Hislerim (Bass)', url: 'https://www.youtube.com/watch?v=o2aQ3k-oArc', tag: 'Trending' },
  { label: 'Alan Walker - Faded (HD)', url: 'https://www.youtube.com/watch?v=60ItHLz5WEA', tag: 'Music' },
  { label: 'Big Buck Bunny (4K 60fps)', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', tag: '4K Demo' },
];

export const SaveFromHero: React.FC<SaveFromHeroProps> = ({
  onSubmit,
  isLoading,
  initialUrl = '',
  activePlatform = 'youtube',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(activePlatform);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
  }, [initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onSubmit(url.trim());
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          if (isValidYouTubeUrl(text.trim())) {
            onSubmit(text.trim());
          }
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleSelectSample = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onSubmit(sampleUrl);
  };

  const isValid = isValidYouTubeUrl(url);

  return (
    <section className="w-full text-center space-y-6">
      {/* SaveFrom Title & Subtitle */}
      <div className="space-y-3 max-w-3xl mx-auto px-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/60 shadow-xs">
          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-500" />
          <span>SaveFrom.net Free Online Video Downloader</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
          The Fastest Free{' '}
          <span className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
            YouTube Video Downloader
          </span>
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Download high-quality MP4 video (1080p, 720p, 4K) and convert crystal-clear 320kbps MP3 audio directly in one click. No registration, 100% free.
        </p>
      </div>

      {/* Main SaveFrom Search Bar */}
      <div className="max-w-3xl mx-auto px-2">
        <form onSubmit={handleSubmit} className="relative group">
          {/* Subtle glowing ambient green ring */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 rounded-2xl blur-md opacity-25 group-hover:opacity-40 group-focus-within:opacity-60 transition duration-500" />

          <div className="relative flex flex-col sm:flex-row items-stretch bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl transition-all focus-within:border-emerald-500 dark:focus-within:border-emerald-500">
            {/* Input Left Icon */}
            <div className="hidden sm:flex items-center pl-3 pr-1 text-emerald-600 dark:text-emerald-400">
              <Download className="w-5 h-5 stroke-[2.4]" />
            </div>

            {/* URL Input Field */}
            <div className="relative flex-1 flex items-center min-w-0">
              <input
                id="savefrom-url-input"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your video link here (e.g. https://www.youtube.com/watch?v=...)"
                disabled={isLoading}
                className="w-full px-3 py-3.5 text-sm sm:text-base font-medium bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-hidden disabled:opacity-60"
              />

              {/* Clear Button */}
              {url && !isLoading && (
                <button
                  type="button"
                  id="clear-url-btn"
                  onClick={handleClear}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  title="Clear link"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Paste Button */}
              {!url && !isLoading && (
                <button
                  type="button"
                  id="paste-url-btn"
                  onClick={handlePaste}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mr-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700/60"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>
              )}
            </div>

            {/* Signature SaveFrom Large Green Download Button */}
            <button
              id="savefrom-download-btn"
              type="submit"
              disabled={!url.trim() || isLoading}
              className={`mt-2 sm:mt-0 flex items-center justify-center gap-2 px-7 sm:px-9 py-3.5 sm:py-4 text-sm sm:text-base font-bold rounded-xl text-white transition-all shadow-lg ${
                !url.trim() || isLoading
                  ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-[0.98] shadow-emerald-500/30'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <span>Download</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>

          {/* Validation Notice */}
          {url && !isValid && !isLoading && (
            <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
              <span>Please enter a valid YouTube, YouTube Shorts, or youtu.be video link.</span>
            </p>
          )}
        </form>

        <p className="mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-500">
          By using our service you accept our{' '}
          <a href="#terms" className="underline hover:text-emerald-600">Terms of Service</a> and{' '}
          <a href="#privacy" className="underline hover:text-emerald-600">Privacy Policy</a>.
        </p>

        {/* Supported Platforms Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {SUPPORTED_PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                selectedPlatform === platform.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {platform.id === 'youtube' && <Youtube className="w-4 h-4 text-red-500" />}
              {platform.id === 'instagram' && <Instagram className="w-4 h-4 text-pink-500" />}
              {platform.id === 'facebook' && <Facebook className="w-4 h-4 text-blue-600" />}
              {platform.id === 'twitter' && <Twitter className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />}
              {platform.id === 'tiktok' && <Video className="w-4 h-4 text-cyan-500" />}
              {platform.id === 'soundcloud' && <Music className="w-4 h-4 text-orange-500" />}
              <span>{platform.name}</span>
            </button>
          ))}
        </div>

        {/* Quick Test Sample URLs */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Try sample:</span>
          </span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.url}
              type="button"
              id={`sample-${sample.tag.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleSelectSample(sample.url)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-zinc-700/60 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>{sample.label}</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded">
                {sample.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
