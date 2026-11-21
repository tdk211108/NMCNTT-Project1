'use client';

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { MusicTrack } from '@/shared/types';

/**
 * Compact Spell Spotify-Card-inspired audio widget positioned beside the Header Cart button.
 * Dynamically reads audio tracks dropped into `public/music/` via `/api/music`.
 */
export function MusicPlayerBar() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(false);
  const uid = useId().replace(/:/g, '');

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/music', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { tracks: [] }))
      .then((payload: { tracks?: MusicTrack[] }) => {
        if (Array.isArray(payload.tracks)) {
          setTracks(payload.tracks);
        }
      })
      .catch(() => {
        // Ignore abort / offline errors quietly so header never stalls.
      });

    return () => controller.abort();
  }, []);

  const currentTrack = tracks[activeIndex] ?? null;
  const activeSrc = currentTrack?.src ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSrc) return;

    audio.load();
    if (isPlayingRef.current) {
      void audio.play().catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    }
  }, [activeSrc]);

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    isPlayingRef.current = true;
    void audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
  }

  function stepTrack(delta: number, forcePlay = false) {
    if (tracks.length === 0) return;
    if (forcePlay) {
      isPlayingRef.current = true;
      setIsPlaying(true);
    }
    setActiveIndex((prev) => (prev + delta + tracks.length) % tracks.length);
  }

  const hasTracks = tracks.length > 0;
  const effectivePlaying = hasTracks && isPlaying;
  const maskId = `cr-vinyl-mask-${uid}`;

  return (
    <div
      data-testid={TEST_IDS.header.musicBar}
      aria-label={VI_MESSAGES.nav.musicPlayerAria}
      title={
        currentTrack
          ? `${currentTrack.title} | ${currentTrack.artist}`
          : VI_MESSAGES.nav.musicEmptyNotice
      }
      className="group relative flex min-h-10 max-w-full items-center gap-2 overflow-hidden rounded-control border-2 border-border-strong bg-surface-subtle px-2 py-1 text-xs shadow-sm sm:max-w-[268px]"
    >
      {/* Ambient blurred glow behind card matching Spell Spotify Card aesthetic */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-4 -left-4 h-16 w-24 rounded-full bg-primary/50 blur-xl transition-opacity duration-300 ${
            effectivePlaying ? 'opacity-85' : 'opacity-40 group-hover:opacity-65'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-subtle/60 to-surface-subtle/90" />
      </div>

      {/* Album cover tile + sliding grooved black vinyl record */}
      <div className="relative z-10 mr-2 flex shrink-0 items-center">
        <div
          className={`relative z-10 flex h-8 w-8 items-center justify-center overflow-hidden rounded-control border border-border-strong bg-[#12141A] shadow-md transition-transform duration-300 ${
            effectivePlaying ? '-translate-x-0.5' : 'group-hover:-translate-x-0.5'
          }`}
        >
          <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id={`cr-art-${uid}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#D71920" />
                <stop offset="100%" stopColor="#141820" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" fill={`url(#cr-art-${uid})`} />
            <circle cx="16" cy="16" r="8" fill="none" stroke="#F8FAFC" strokeOpacity="0.8" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="2.5" fill="#FF4D58" />
          </svg>
        </div>

        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 left-4 z-0 h-7 w-7 -translate-y-1/2 transition-transform duration-300 ${
            effectivePlaying ? 'translate-x-1.5' : '-translate-x-1 group-hover:translate-x-1.5'
          }`}
        >
          <svg
            viewBox="0 0 110 110"
            className="h-full w-full motion-safe:animate-spin"
            style={{
              animationDuration: '3s',
              animationPlayState: effectivePlaying ? 'running' : 'paused',
            }}
          >
            <mask id={maskId} width="110" height="110" x="0" y="0" maskUnits="userSpaceOnUse">
              <circle cx="55" cy="55" r="55" fill="#fff" />
            </mask>
            <g mask={`url(#${maskId})`}>
              <circle cx="55" cy="55" r="55" fill="#090B10" />
              <circle cx="55" cy="55" r="46" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
              <circle cx="55" cy="55" r="36" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.8" />
              <circle cx="55" cy="55" r="26" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" />
              <path fill="#fff" fillOpacity="0.28" d="M-10 42l65 13-65 13V42zm130 0l-65 13 65 13V42z" />
              <circle cx="55" cy="55" r="10" fill="#D71920" />
              <circle cx="55" cy="55" r="3.5" fill="#F8FAFC" />
            </g>
          </svg>
        </div>
      </div>

      {/* Compact Track Metadata */}
      <div className="relative z-10 min-w-0 flex-1 pr-1">
        {currentTrack ? (
          <div className="flex flex-col leading-tight">
            <span className="truncate font-semibold text-ink">{currentTrack.title}</span>
            <span className="truncate font-mono text-[10px] text-ink-muted">{currentTrack.artist}</span>
          </div>
        ) : (
          <span className="block truncate font-mono text-[10px] text-ink-muted">
            {VI_MESSAGES.nav.musicEmptyNotice}
          </span>
        )}
      </div>

      {/* 3 Compact Controls: Prev / Play-Pause / Next */}
      <div className="relative z-10 flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          disabled={!hasTracks}
          onClick={() => stepTrack(-1)}
          aria-label={VI_MESSAGES.nav.musicPrevAria}
          data-testid={TEST_IDS.header.musicPrev}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <button
          type="button"
          disabled={!hasTracks}
          onClick={togglePlayPause}
          aria-label={
            effectivePlaying ? VI_MESSAGES.nav.musicPauseAria : VI_MESSAGES.nav.musicPlayAria
          }
          aria-pressed={effectivePlaying}
          data-testid={TEST_IDS.header.musicToggle}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-primary text-primary-fg hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {effectivePlaying ? (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          disabled={!hasTracks}
          onClick={() => stepTrack(1)}
          aria-label={VI_MESSAGES.nav.musicNextAria}
          data-testid={TEST_IDS.header.musicNext}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack?.src}
        preload="metadata"
        onEnded={() => stepTrack(1, true)}
      />
    </div>
  );
}
