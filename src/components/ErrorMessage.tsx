import React from 'react';
import { AlertTriangle, Lock, Globe, Clock, RefreshCw, XCircle } from 'lucide-react';
import { FetchInfoErrorResponse } from '../types.js';

interface ErrorMessageProps {
  error: string;
  errorCode?: FetchInfoErrorResponse['errorCode'];
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, errorCode, onRetry }) => {
  const getIcon = () => {
    switch (errorCode) {
      case 'AGE_RESTRICTED':
        return <Lock className="w-5 h-5 text-amber-500" />;
      case 'GEO_RESTRICTED':
        return <Globe className="w-5 h-5 text-purple-500" />;
      case 'RATE_LIMITED':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'TIMEOUT':
        return <RefreshCw className="w-5 h-5 text-rose-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (errorCode) {
      case 'INVALID_URL':
        return 'INVALID YOUTUBE LINK';
      case 'VIDEO_NOT_FOUND':
        return 'VIDEO UNAVAILABLE OR REMOVED';
      case 'AGE_RESTRICTED':
        return 'AGE-RESTRICTED CONTENT';
      case 'GEO_RESTRICTED':
        return 'REGION-RESTRICTED CONTENT';
      case 'RATE_LIMITED':
        return 'RATE LIMIT EXCEEDED';
      case 'TIMEOUT':
        return 'EXTRACTION TIMED OUT';
      default:
        return 'EXTRACTION ERROR';
    }
  };

  return (
    <div
      id="error-banner"
      className="w-full bg-red-950/20 border-2 border-red-600/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-zinc-900 border border-red-600/30 text-red-500 shadow-xs flex-shrink-0">
          {getIcon()}
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-500 block mb-0.5">
            [ ERROR // {errorCode || 'SERVER_EXCEPTION'} ]
          </span>
          <h4 className="font-black text-sm sm:text-base uppercase tracking-tight text-zinc-950 dark:text-white">
            {getTitle()}
          </h4>
          <p className="mt-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {error}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-end sm:self-center flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

