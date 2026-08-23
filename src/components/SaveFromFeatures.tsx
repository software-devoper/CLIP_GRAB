import React from 'react';
import {
  Zap,
  ShieldCheck,
  Smartphone,
  Film,
  Music,
  Globe2,
  HardDriveDownload,
  Infinity,
  Sparkles,
} from 'lucide-react';

export const SaveFromFeatures: React.FC = () => {
  const features = [
    {
      title: 'High-Speed Streaming',
      description:
        'Direct chunked streaming without queue delays or throttling. Enjoy max bandwidth on any connection.',
      icon: <Zap className="w-5 h-5 text-emerald-500" />,
    },
    {
      title: '100% Free & Unlimited',
      description:
        'No subscription, no accounts, and no limits on how many videos or audio tracks you can save per day.',
      icon: <Infinity className="w-5 h-5 text-green-500" />,
    },
    {
      title: 'Full HD, 2K & 4K Quality',
      description:
        'Download original source resolutions from standard 720p/1080p HD up to crisp 4K Ultra HD video.',
      icon: <Film className="w-5 h-5 text-teal-500" />,
    },
    {
      title: 'High-Bitrate MP3 Audio',
      description:
        'Convert any YouTube music video into clean 320 kbps MP3 or M4A audio files for offline listening.',
      icon: <Music className="w-5 h-5 text-purple-500" />,
    },
    {
      title: 'Universal Device Support',
      description:
        'Works seamlessly on Windows, macOS, Linux, Android smartphones, iPhones, and iPad tablets.',
      icon: <Smartphone className="w-5 h-5 text-blue-500" />,
    },
    {
      title: 'Safe, Clean & Private',
      description:
        'No ads, no popups, no tracking cookies, and zero server-side storage of your personal data.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
    },
  ];

  return (
    <section className="w-full space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Why Choose <span className="text-emerald-600 dark:text-emerald-400">SaveFrom.net</span>?
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          The most trusted online video downloader used by millions of users worldwide.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((item) => (
          <div
            key={item.title}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              {item.icon}
            </div>

            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
              {item.title}
            </h3>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
