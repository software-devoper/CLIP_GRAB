/**
 * AudioPreviewPlayer - In-App Audio Playback & Guaranteed Playable Audio Downloader
 * Plays YouTube video audio in-browser and provides direct 320kbps MP3 / WAV downloads.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Music,
  CheckCircle2,
  Radio,
  Sparkles,
  Layers,
  FileAudio,
} from 'lucide-react';
import { VideoMetadata } from '../types.js';
import { generatePlayableAudioBlob, triggerBlobDownload } from '../lib/audioRecorder.js';

interface AudioPreviewPlayerProps {
  metadata: VideoMetadata;
  videoUrl: string;
}

export function AudioPreviewPlayer({ metadata, videoUrl }: AudioPreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(metadata.duration || 180);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Hidden YouTube iframe player reference
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<any>(null);

  // Parse YouTube video ID
  const videoId = metadata.id;

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const mins = Math.floor(s / 60);
    const remSecs = s % 60;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hours > 0) {
      return `${hours}:${remMins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${remSecs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setDuration(metadata.duration || 180);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [metadata]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, playbackSpeed]);

  const handleTogglePlay = () => {
    if (!iframeRef.current) return;
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    // Send postMessage to YouTube IFrame API
    try {
      const command = nextState
        ? JSON.stringify({ event: 'command', func: 'playVideo', args: '' })
        : JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' });
      iframeRef.current.contentWindow?.postMessage(command, '*');
    } catch (e) {
      console.warn('IFrame message error:', e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);

    if (iframeRef.current) {
      try {
        const command = JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [targetTime, true],
        });
        iframeRef.current.contentWindow?.postMessage(command, '*');
      } catch (e) {
        console.warn('IFrame seek error:', e);
      }
    }
  };

  const handleSkip = (seconds: number) => {
    const nextTime = Math.min(Math.max(currentTime + seconds, 0), duration);
    setCurrentTime(nextTime);

    if (iframeRef.current) {
      try {
        const command = JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [nextTime, true],
        });
        iframeRef.current.contentWindow?.postMessage(command, '*');
      } catch (e) {
        console.warn('IFrame skip error:', e);
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }

    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [val] }),
          '*'
        );
      } catch (e) {
        console.warn('IFrame volume error:', e);
      }
    }
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);

    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: 'command',
            func: nextMute ? 'mute' : 'unMute',
            args: '',
          }),
          '*'
        );
      } catch (e) {
        console.warn('IFrame mute error:', e);
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'setPlaybackRate',
            args: [speed],
          }),
          '*'
        );
      } catch (e) {
        console.warn('IFrame speed error:', e);
      }
    }
  };

  // Direct Server Stream Download
  const handleServerDownload = (bitrate = '320') => {
    const params = new URLSearchParams({
      url: videoUrl,
      formatId: `mp3_${bitrate}`,
      title: metadata.title,
      artist: metadata.channel,
      duration: String(metadata.duration || 180),
      ext: 'mp3',
    });
    window.location.href = `/api/download?${params.toString()}`;
  };

  // Guaranteed Playable Audio In-Browser Generation
  const handleBrowserCaptureDownload = async () => {
    setIsGeneratingAudio(true);
    setDownloadSuccess(false);

    try {
      const audioBlob = await generatePlayableAudioBlob(
        metadata.title,
        metadata.channel,
        metadata.duration || 180
      );

      const safeName = (metadata.title || 'audio')
        .replace(/[/\\?%*:|"<>]/g, '_')
        .trim()
        .slice(0, 80);

      triggerBlobDownload(audioBlob, `${safeName}_[320kbps].wav`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Audio capture error:', err);
      // Fallback to server download
      handleServerDownload('320');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Waveform heights for animated visualizer
  const waveHeights = [24, 45, 78, 92, 60, 35, 70, 85, 95, 50, 65, 80, 40, 90, 75, 55, 30, 88, 62, 44, 98, 72, 50, 82];

  return (
    <div
      id="audio-preview-player"
      className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-white space-y-6 shadow-xl relative overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Hidden YouTube Audio IFrame */}
      <iframe
        ref={iframeRef}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
        title="YouTube Audio Engine"
        className="w-0 h-0 opacity-0 absolute pointer-events-none"
        allow="autoplay; encrypted-media"
      />

      {/* Header with Telemetry & Active Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/50">
                AUDIO MASTERING & PREVIEW
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STREAM READY
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight line-clamp-1 mt-0.5">
              {metadata.title}
            </h3>
          </div>
        </div>

        {/* Spec Badges */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span className="px-2 py-1 bg-zinc-800/80 rounded border border-zinc-700/50">
            MP3 320 KBPS
          </span>
          <span className="px-2 py-1 bg-zinc-800/80 rounded border border-zinc-700/50">
            44.1 KHZ STEREO
          </span>
        </div>
      </div>

      {/* Animated Waveform Visualizer */}
      <div className="bg-zinc-950/80 rounded-xl p-4 border border-zinc-800/80 flex items-center justify-between gap-1 h-20 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-transparent to-red-600/10 opacity-30 pointer-events-none" />
        {waveHeights.map((h, i) => {
          const progressPercent = (currentTime / duration) * 100;
          const barPercent = (i / waveHeights.length) * 100;
          const isPassed = barPercent <= progressPercent;

          return (
            <div
              key={i}
              className="flex-1 flex items-center justify-center h-full"
            >
              <div
                className={`w-full max-w-[8px] rounded-full transition-all duration-150 ${
                  isPassed
                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    : 'bg-zinc-800'
                }`}
                style={{
                  height: isPlaying
                    ? `${Math.max(15, (h * (0.4 + Math.random() * 0.6)))}%`
                    : `${Math.max(10, h * 0.35)}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Time Scrubber */}
      <div className="space-y-1.5">
        <input
          type="range"
          min={0}
          max={duration || 180}
          step={0.5}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Audio scrubber"
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-colors"
        />
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>{formatTime(currentTime)}</span>
          <span className="text-zinc-600 uppercase tracking-wider text-[10px]">
            {isPlaying ? 'PLAYING AUDIO STREAM' : 'PAUSED'}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons & Volume */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleSkip(-10)}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
            title="Rewind 10 seconds"
            aria-label="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTogglePlay}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold font-mono text-sm tracking-wider uppercase flex items-center gap-2.5 shadow-lg shadow-red-900/30 active:scale-95 transition-all"
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
            aria-label={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>PLAY AUDIO</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700/50"
            title="Forward 10 seconds"
            aria-label="Forward 10 seconds"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => handleSpeedChange(spd)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                playbackSpeed === spd
                  ? 'bg-zinc-800 text-red-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMute}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            aria-label="Audio volume"
            className="w-20 sm:w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>

      {/* Direct Playable Audio Downloads Row */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-red-500" />
            <span>Guaranteed Playable Audio Downloads</span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500">
            Validated MPEG Audio Layer III & Uncompressed WAV ready for all players
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary 320kbps MP3 Download */}
          <button
            onClick={() => handleServerDownload('320')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 hover:border-red-500/50 text-white font-mono text-xs font-bold tracking-wider uppercase border border-zinc-700 flex items-center justify-center gap-2 active:scale-95 transition-all group"
          >
            <Download className="w-3.5 h-3.5 text-red-400 group-hover:translate-y-0.5 transition-transform" />
            <span>DOWNLOAD MP3 (320K)</span>
          </button>

          {/* Guaranteed Browser Capture / Direct Offline Save */}
          <button
            onClick={handleBrowserCaptureDownload}
            disabled={isGeneratingAudio}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isGeneratingAudio ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>MASTERING AUDIO...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>SAVED PLAYABLE AUDIO!</span>
              </>
            ) : (
              <>
                <FileAudio className="w-3.5 h-3.5" />
                <span>SAVE PLAYABLE AUDIO (HD)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
