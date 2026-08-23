import React from 'react';
import { Film, Moon, Sun, ShieldCheck, Activity, Terminal } from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, onToggleDarkMode }) => {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-900 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 flex items-center justify-center text-red-500 shadow-xs">
            <Film className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-[-0.04em] uppercase italic text-zinc-950 dark:text-white">
                CLIP<span className="text-red-600">GRAB</span>
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold tracking-widest uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded border border-zinc-200 dark:border-zinc-800">
                v4.2.0
              </span>
            </div>
            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 dark:text-zinc-500 hidden sm:block">
              Media Extraction Engine
            </p>
          </div>
        </div>

        {/* Right side telemetry & controls */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-600 dark:text-zinc-400 font-semibold">
                System: Ready
              </span>
            </div>
            <div className="text-[9px] uppercase font-mono tracking-widest text-zinc-400 dark:text-zinc-600">
              Rate: 10 req / min
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Stateless</span>
          </div>

          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-zinc-200 dark:border-zinc-800"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};

