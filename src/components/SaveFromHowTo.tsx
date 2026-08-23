import React from 'react';
import { Copy, Link2, Download, ArrowRight, CheckCircle2 } from 'lucide-react';

export const SaveFromHowTo: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Copy the Video URL',
      description:
        'Open YouTube, Instagram, TikTok, or Facebook and copy the link of the video or music track you want to download.',
      icon: <Copy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      number: '02',
      title: 'Paste into SaveFrom.net',
      description:
        'Paste the copied link into the input field at the top of the page. Our tool will automatically process the video.',
      icon: <Link2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      number: '03',
      title: 'Select Quality & Download',
      description:
        'Choose your desired resolution (MP4 1080p, 720p, 480p) or audio format (MP3 320kbps) and hit the green Download button.',
      icon: <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
  ];

  return (
    <section className="w-full space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          How to Download Videos with{' '}
          <span className="text-emerald-600 dark:text-emerald-400">SaveFrom.net</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Save your favorite media files to your device in three simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, idx) => (
          <div
            key={step.number}
            className="relative p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {step.icon}
                </div>
                <span className="font-mono text-2xl font-black text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-500 transition-colors">
                  {step.number}
                </span>
              </div>

              <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                {step.title}
              </h3>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {step.description}
              </p>
            </div>

            <div className="pt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Step {idx + 1} of 3</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
