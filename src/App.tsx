/**
 * SaveFrom.net - The Fastest Free YouTube Video & Audio Downloader
 */

import React, { useState, useEffect } from 'react';
import { SaveFromNavbar } from './components/SaveFromNavbar.js';
import { SaveFromHero } from './components/SaveFromHero.js';
import { SaveFromResultCard } from './components/SaveFromResultCard.js';
import { SaveFromHelperPromo } from './components/SaveFromHelperPromo.js';
import { SaveFromHowTo } from './components/SaveFromHowTo.js';
import { SaveFromFeatures } from './components/SaveFromFeatures.js';
import { SaveFromFAQ } from './components/SaveFromFAQ.js';
import { SaveFromFooter } from './components/SaveFromFooter.js';
import { LoadingSkeleton } from './components/LoadingSkeleton.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { VideoMetadata, GroupedFormats, FetchInfoResponse } from './types.js';
import { fetchMetadataClientSide } from './lib/clientExtractor.js';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('savefrom_theme');
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
  const [selectedPlatform, setSelectedPlatform] = useState('youtube');

  // Sync dark mode class with document root and body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('savefrom_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('savefrom_theme', 'light');
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

      // If backend responded with 404 or failed on static host, fallback to client extractor
      console.info('Backend /api/fetch-info engaged client-side fallback engine...');
      const fallbackResult = await fetchMetadataClientSide(url);
      setMetadata(fallbackResult.metadata);
      setFormats(fallbackResult.formats);
    } catch (err: any) {
      try {
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

  const handleSelectPlatform = (platform: string) => {
    setSelectedPlatform(platform);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? 'dark bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-zinc-900'
      } flex flex-col font-sans transition-colors`}
    >
      {/* SaveFrom Top Navigation */}
      <SaveFromNavbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onSelectPlatform={handleSelectPlatform}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 space-y-12">
        {/* Main SaveFrom Downloader Hero */}
        <SaveFromHero
          onSubmit={handleFetchInfo}
          isLoading={isLoading}
          initialUrl={currentUrl}
          activePlatform={selectedPlatform}
        />

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

          {/* Extracted Video Information & Download Formats */}
          {metadata && formats && !isLoading && (
            <div className="space-y-6 animate-in fade-in-50 duration-300">
              <SaveFromResultCard
                metadata={metadata}
                formats={formats}
                videoUrl={currentUrl}
              />
            </div>
          )}
        </section>

        {/* SaveFrom "ss" URL Shortcut & Extension promo */}
        <SaveFromHelperPromo />

        {/* How to Download Steps */}
        <div id="how-to">
          <SaveFromHowTo />
        </div>

        {/* SaveFrom Advantages & Features */}
        <SaveFromFeatures />

        {/* FAQ Accordion */}
        <div id="faq">
          <SaveFromFAQ />
        </div>
      </main>

      {/* SaveFrom Footer */}
      <SaveFromFooter />
    </div>
  );
}
