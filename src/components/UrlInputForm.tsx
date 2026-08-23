import React, { useState } from 'react';
import { Clipboard, X, ArrowRight, Loader2, Youtube, Sparkles, Zap } from 'lucide-react';
import { isValidYouTubeUrl } from '../lib/validators.js';

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

const SAMPLE_URLS = [
  { label: 'Big Buck Bunny (4K)', url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' },
  { label: 'Sintel Open Movie', url: 'https://www.youtube.com/watch?v=eRsGyueVLvQ' },
  { label: 'Lofi Chill Beat', url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk' },
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [pasteError, setPasteError] = useState(false);

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
      setPasteError(true);
      setTimeout(() => setPasteError(false), 2000);
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow ambient background on hover/focus */}
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-rose-600 to-zinc-800 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 group-focus-within:opacity-50 transition duration-700"></div>

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl p-1.5 sm:p-2 shadow-2xl transition-all">
          {/* Leading icon */}
          <div className="hidden sm:flex items-center pl-4 pr-2 text-red-600 dark:text-red-500">
            <Youtube className="w-6 h-6 stroke-[2.2]" />
          </div>

          {/* URL text input */}
          <div className="relative flex-1 flex items-center">
            <input
              id="youtube-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here (e.g. https://www.youtube.com/watch?v=...)"
              disabled={isLoading}
              className="w-full px-3 py-3 text-sm sm:text-base font-medium bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none disabled:opacity-60"
            />

            {/* Clear button */}
            {url && !isLoading && (
              <button
                type="button"
                id="clear-url-btn"
                onClick={handleClear}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Paste button */}
            {!url && !isLoading && (
              <button
                type="button"
                id="paste-url-btn"
                onClick={handlePaste}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 mr-2 text-xs font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700/50"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>
            )}
          </div>

          {/* Bold Red Action Button */}
          <button
            id="fetch-links-btn"
            type="submit"
            disabled={!url.trim() || isLoading}
            className={`mt-2 sm:mt-0 flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-tight rounded-lg text-white transition-all shadow-md ${
              !url.trim() || isLoading
                ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed shadow-none'
                : 'bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-red-600/30'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-mono tracking-normal">Extracting...</span>
              </>
            ) : (
              <>
                <span>Get Download Links</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>

        {/* Validation hint */}
        {url && !isValid && !isLoading && (
          <p className="mt-2 text-xs font-mono text-amber-600 dark:text-amber-400 flex items-center gap-1.5 px-2">
            <span>• Please paste a standard YouTube video link (watch, youtu.be, or shorts).</span>
          </p>
        )}
      </form>

      {/* Quick sample URLs for demo */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[11px] text-zinc-500 dark:text-zinc-500 font-semibold">
          <Sparkles className="w-3 h-3 text-red-500" />
          <span>Quick test:</span>
        </span>
        {SAMPLE_URLS.map((sample) => (
          <button
            key={sample.url}
            type="button"
            id={`sample-${sample.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => handleSelectSample(sample.url)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md font-mono text-[11px] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors disabled:opacity-50"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};

