import React, { useState } from 'react';
import {
  Download,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
  ShieldCheck,
  Zap,
  Smartphone,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface SaveFromNavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectPlatform?: (platform: string) => void;
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export const SaveFromNavbar: React.FC<SaveFromNavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onSelectPlatform,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const navLinks = [
    { label: 'YouTube', id: 'youtube', badge: 'Popular' },
    { label: 'Instagram', id: 'instagram' },
    { label: 'TikTok', id: 'tiktok' },
    { label: 'Facebook', id: 'facebook' },
    { label: 'Twitter / X', id: 'twitter' },
    { label: 'SaveFrom APK', id: 'apk', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { label: 'Helper Extension', id: 'extension' },
  ];

  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
        {/* Brand Logo - SaveFrom.net iconic styling */}
        <a
          href="/"
          className="flex items-center gap-2.5 group focus:outline-hidden"
          title="SaveFrom.net - Online Video Downloader"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Download className="w-5 h-5 stroke-[2.8]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="font-extrabold text-2xl tracking-tight text-zinc-900 dark:text-white">
                Save<span className="text-emerald-500">From</span>
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 ml-0.5">
                .net
              </span>
            </div>
            <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider -mt-1 hidden sm:block">
              Free Video Downloader
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectPlatform?.(link.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1.5"
            >
              {link.icon}
              <span>{link.label}</span>
              {link.badge && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
              title="Select Language"
            >
              <span>{selectedLang.flag}</span>
              <span className="hidden sm:inline">{selectedLang.code.toUpperCase()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {isLangOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsLangOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1.5 max-h-80 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Select Language
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLang(lang);
                        setIsLangOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 transition-colors ${
                        selectedLang.code === lang.code
                          ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/60 dark:bg-emerald-950/30'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      {selectedLang.code === lang.code && (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            aria-label="Toggle dark mode"
            className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-1">
            Supported Downloaders
          </div>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onSelectPlatform?.(link.id);
                setIsMenuOpen(false);
              }}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                {link.icon}
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full">
                  {link.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
