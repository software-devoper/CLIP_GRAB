import React from 'react';
import { Download, ShieldCheck, Heart, Globe, ExternalLink, AlertCircle } from 'lucide-react';
import { LANGUAGES } from './SaveFromNavbar.js';

export const SaveFromFooter: React.FC = () => {
  const downloaders = [
    { name: 'YouTube Downloader', href: '#' },
    { name: 'YouTube to MP3', href: '#' },
    { name: 'Instagram Downloader', href: '#' },
    { name: 'TikTok Video Downloader', href: '#' },
    { name: 'Facebook Video Downloader', href: '#' },
    { name: 'Twitter / X Downloader', href: '#' },
    { name: 'SoundCloud MP3', href: '#' },
    { name: 'Vimeo Downloader', href: '#' },
  ];

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Download className="w-4 h-4 stroke-[2.8]" />
              </div>
              <div className="flex items-baseline">
                <span className="font-black text-2xl tracking-tight text-zinc-900 dark:text-white">
                  Save<span className="text-emerald-500">From</span>
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-0.5">
                  .net
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
              SaveFrom.net is the leading online video downloader allowing you to save high-definition MP4 videos and high-bitrate MP3 music for free.
            </p>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>SSL Encrypted & Safe</span>
              </span>
              <span>•</span>
              <span>No Logs Retained</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
              Supported Tools
            </h4>
            <ul className="space-y-2 text-xs">
              {downloaders.slice(0, 4).map((tool) => (
                <li key={tool.name}>
                  <a
                    href={tool.href}
                    className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {tool.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
              Legal & About
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#how-to"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  How to Download
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  FAQ & Help
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#privacy"
                  className="text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-800 dark:text-zinc-300">Disclaimer:</strong> SaveFrom.net is a free online tool intended for personal archiving, backup, and educational use of non-copyrighted or authorized content. We do not host or store any media on our servers. All video and audio streams are retrieved directly from the third-party providers.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span>© 2026 SaveFrom.net — All rights reserved.</span>
          <div className="flex items-center gap-3">
            <span>Powered by Direct Stream Engine</span>
            <span>•</span>
            <span>SaveFrom Helper v5.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
