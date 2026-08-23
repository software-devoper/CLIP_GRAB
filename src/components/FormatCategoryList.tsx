import React, { useState } from 'react';
import { GroupedFormats, FormatCategory } from '../types.js';
import { FormatButton } from './FormatButton.js';
import { Video, Film, Music, Layers, Info } from 'lucide-react';

interface FormatCategoryListProps {
  formats: GroupedFormats;
  videoUrl: string;
  videoTitle: string;
  duration?: number;
  artist?: string;
}

export const FormatCategoryList: React.FC<FormatCategoryListProps> = ({
  formats,
  videoUrl,
  videoTitle,
  duration,
  artist,
}) => {
  const [activeTab, setActiveTab] = useState<FormatCategory | 'all'>('videoWithAudio');

  const categories: {
    id: FormatCategory;
    title: string;
    description: string;
    icon: React.ReactNode;
    items: typeof formats.videoWithAudio;
  }[] = [
    {
      id: 'videoWithAudio',
      title: 'Video + Audio',
      description: 'Standard MP4 files with embedded audio track. Compatible with all devices.',
      icon: <Video className="w-4 h-4 text-red-500" />,
      items: formats.videoWithAudio,
    },
    {
      id: 'audioOnly',
      title: 'Audio Only',
      description: 'High-bitrate MP3 conversions (320k/192k/128k) and original M4A audio tracks.',
      icon: <Music className="w-4 h-4 text-emerald-500" />,
      items: formats.audioOnly,
    },
    {
      id: 'videoOnly',
      title: 'Ultra HD Video (DASH)',
      description: 'Ultra high-definition video streams (4K / 2K / 1080p60) without audio.',
      icon: <Film className="w-4 h-4 text-purple-500" />,
      items: formats.videoOnly,
    },
  ];

  return (
    <div id="format-categories-container" className="w-full space-y-6">
      {/* Category Tab Selector with Monospace Typography */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {cat.icon}
              <span className="truncate">{cat.title}</span>
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-md font-mono ${
                  isActive
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {cat.items.length}
              </span>
            </button>
          );
        })}

        {/* View All Option */}
        <button
          id="tab-all"
          onClick={() => setActiveTab('all')}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all ${
            activeTab === 'all'
              ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All</span>
        </button>
      </div>

      {/* Render Format Groups */}
      <div className="space-y-6">
        {categories
          .filter((cat) => activeTab === 'all' || activeTab === cat.id)
          .map((category) => (
            <div
              key={category.id}
              id={`section-${category.id}`}
              className="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xl transition-all"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">{category.icon}</div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base uppercase tracking-tight text-zinc-950 dark:text-white">
                      {category.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{category.description}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  [{category.items.length} STREAMS]
                </span>
              </div>

              {/* Items List */}
              {category.items.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {category.items.map((item) => (
                    <FormatButton
                      key={item.formatId}
                      format={item}
                      videoUrl={videoUrl}
                      videoTitle={videoTitle}
                      duration={duration}
                      artist={artist}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-xs font-mono text-zinc-500">
                  No formats available in this category.
                </div>
              )}
            </div>
          ))}

        {/* Informational Edge Pipeline Notice */}
        <div className="bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 border-dashed rounded-xl p-5 flex items-center justify-center text-center">
          <p className="text-zinc-500 dark:text-zinc-500 text-[11px] font-mono uppercase tracking-widest leading-relaxed max-w-md">
            Direct streaming mode active • No server storage • Direct chunked proxy through Node.js Edge layer
          </p>
        </div>
      </div>
    </div>
  );
};

