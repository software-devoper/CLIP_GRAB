import React from 'react';
import { ShieldCheck, Cpu, HardDriveDownload, AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 mt-16 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Features highlight */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-red-600 dark:text-red-500 border border-zinc-200 dark:border-zinc-800">
              <HardDriveDownload className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-950 dark:text-white">
                Direct Streaming
              </h4>
              <p className="mt-1 text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Zero disk storage on server. Media streams directly from yt-dlp to browser.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 border border-zinc-200 dark:border-zinc-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-950 dark:text-white">
                100% Stateless
              </h4>
              <p className="mt-1 text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                No user accounts, no logins, no persistent tracking, and no session cookies.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-purple-600 dark:text-purple-400 border border-zinc-200 dark:border-zinc-800">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-zinc-950 dark:text-white">
                Multi-Format Matrix
              </h4>
              <p className="mt-1 text-xs font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Support for 4K/2K/1080p MP4, 320k MP3 audio conversions, and AAC/M4A.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="p-4 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 leading-relaxed">
            <strong className="text-zinc-900 dark:text-zinc-300 uppercase tracking-wider">Usage & Archiving Notice:</strong> This tool is intended for personal archiving, educational use, and downloading media you have the legal right to access. Please respect copyright laws and creator intellectual property.
          </p>
        </div>

        {/* Bottom Technical Telemetry Bar */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
          <span>Stateless Tool • No User Data Retained</span>
          <span>© ClipGrab Labs • Powered by yt-dlp & FFmpeg</span>
        </div>
      </div>
    </footer>
  );
};

