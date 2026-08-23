import React, { useState } from 'react';
import {
  Lightbulb,
  Copy,
  Check,
  Chrome,
  Smartphone,
  Download,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
} from 'lucide-react';

export const SaveFromHelperPromo: React.FC = () => {
  const [copiedTrick, setCopiedTrick] = useState(false);

  const sampleUrlBefore = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
  const sampleUrlAfter = 'https://www.ssyoutube.com/watch?v=aqz-KE-bpKQ';

  const handleCopyTrick = async () => {
    try {
      await navigator.clipboard.writeText(sampleUrlAfter);
      setCopiedTrick(true);
      setTimeout(() => setCopiedTrick(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* The Famous SaveFrom "ss" URL Shortcut Card */}
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/40 dark:via-zinc-900 dark:to-zinc-900 border-2 border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-5 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700">
              <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>SaveFrom.net Fast Trick</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white">
              Add <span className="text-emerald-600 dark:text-emerald-400 font-mono">"ss"</span> before YouTube in address bar
            </h3>

            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              To download any video even faster, simply insert <strong className="text-emerald-700 dark:text-emerald-300 font-mono">"ss"</strong> in front of the youtube domain directly in your browser's address bar.
            </p>
          </div>

          <div className="w-full md:w-auto flex flex-col items-stretch sm:items-end gap-2">
            <div className="px-4 py-3 bg-white dark:bg-zinc-950 border border-emerald-300 dark:border-emerald-700 rounded-xl font-mono text-xs sm:text-sm shadow-xs flex items-center justify-between gap-3">
              <span className="text-zinc-500">https://www.</span>
              <span className="bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded">ss</span>
              <span className="text-zinc-900 dark:text-white font-bold">youtube.com/watch?v=...</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={sampleUrlAfter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <span>Try Demo URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleCopyTrick}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                title="Copy sample URL"
              >
                {copiedTrick ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTrick ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SaveFrom Helper Browser Extension & Mobile App Promo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Browser Extension Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Chrome className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                SaveFrom.net Helper
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full">
                Extension
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Add a direct download button right under YouTube videos in Chrome, Firefox, Edge, Opera, and Safari.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <a
                href="https://en.savefrom.net/user.php"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 underline"
              >
                <span>Install for Browser</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Android APK Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/80 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                SaveFrom for Android
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded-full">
                APK App
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Download any video from YouTube, TikTok, and Instagram in one tap directly from your mobile device.
            </p>
            <div className="pt-2 flex items-center gap-2">
              <a
                href="https://en.savefrom.net/apk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-500 underline"
              >
                <span>Download APK (Free)</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
