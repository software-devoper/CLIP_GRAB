import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const SaveFromFAQ: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is SaveFrom.net free to use?',
      answer:
        'Yes! SaveFrom.net is 100% free with unlimited downloads. You do not need to register, create an account, or pay any fees to download videos in high quality.',
    },
    {
      question: 'What video and audio formats are supported?',
      answer:
        'SaveFrom supports MP4 video (with full audio) in 1080p Full HD, 720p HD, 480p, and 360p. For audio, it supports high-bitrate MP3 conversions up to 320 kbps, M4A, and WEBM formats.',
    },
    {
      question: 'How do I download YouTube videos on iPhone or iPad (iOS)?',
      answer:
        'On iOS, open Safari, navigate to SaveFrom.net, paste the video link, and press Download. Safari will prompt you to download the file directly to your Files app, where you can save it to your Photos Camera Roll.',
    },
    {
      question: 'How does the "ss" YouTube shortcut work?',
      answer:
        'Simply edit the URL in your browser address bar by inserting "ss" before "youtube.com" (e.g. change https://www.youtube.com/watch?v=... to https://www.ssyoutube.com/watch?v=...). It will instantly redirect to SaveFrom.net with your video ready to download.',
    },
    {
      question: 'Where are the downloaded video and audio files saved?',
      answer:
        'Downloaded media is automatically stored in your device\'s default "Downloads" folder on Windows, Mac, Android, and iOS.',
    },
    {
      question: 'Can I extract MP3 audio from music videos?',
      answer:
        'Yes! SaveFrom has a built-in MP3 converter that lets you extract audio in 320 kbps, 192 kbps, or 128 kbps quality with accurate ID3 tags and album artwork.',
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="w-full space-y-6">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6 text-emerald-500" />
          <span>Frequently Asked Questions</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
          Everything you need to know about downloading videos with SaveFrom.net
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={faq.question}
              className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 overflow-hidden shadow-xs transition-colors"
            >
              <button
                onClick={() => toggleFAQ(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-zinc-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <span>{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
