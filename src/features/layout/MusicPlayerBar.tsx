'use client';

import { Pause, Play, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { MusicTrack } from '@/shared/types';

export const DEFAULT_MUSIC_VOLUME = 0.2;
export const MUSIC_VOLUME_STORAGE_KEY = 'coreraster-music-volume';
const MUSIC_VOLUME_EVENT = 'coreraster-music-volume-change';

export function clampMusicVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MUSIC_VOLUME;
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

export function readSavedMusicVolume(storage?: Pick<Storage, 'getItem'> | null): number {
  if (!storage) return DEFAULT_MUSIC_VOLUME;
  try {
    const raw = storage.getItem(MUSIC_VOLUME_STORAGE_KEY);
    if (raw === null || raw.trim() === '') return DEFAULT_MUSIC_VOLUME;
    return clampMusicVolume(Number(raw));
  } catch {
    return DEFAULT_MUSIC_VOLUME;
  }
}

function subscribeMusicVolume(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === MUSIC_VOLUME_STORAGE_KEY) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(MUSIC_VOLUME_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(MUSIC_VOLUME_EVENT, onStoreChange);
  };
}

function getMusicVolumeSnapshot(): number {
  return readSavedMusicVolume(typeof window !== 'undefined' ? window.localStorage : null);
}

function getMusicVolumeServerSnapshot(): number {
  return DEFAULT_MUSIC_VOLUME;
}

/**
 * Compact Spell Spotify-Card-inspired audio widget positioned beside the Header Cart button.
 * Dynamically reads audio tracks dropped into `public/music/` via `/api/music`, defaults
 * audio level to Low (20%), and persists user volume adjustments in localStorage.
 */
export function MusicPlayerBar() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const effectiveVolume = useSyncExternalStore(
    subscribeMusicVolume,
    getMusicVolumeSnapshot,
    getMusicVolumeServerSnapshot,
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const volumeGroupRef = useRef<HTMLDivElement>(null);
  const lastNonZeroVolumeRef = useRef(DEFAULT_MUSIC_VOLUME);
  const effectiveVolumeRef = useRef(DEFAULT_MUSIC_VOLUME);
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
    effectiveVolumeRef.current = effectiveVolume;
    if (effectiveVolume > 0) {
      lastNonZeroVolumeRef.current = effectiveVolume;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = effectiveVolume;
    audio.muted = effectiveVolume === 0;
  }, [effectiveVolume, activeSrc]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeSrc) return;

    audio.load();
    audio.volume = effectiveVolumeRef.current;
    audio.muted = effectiveVolumeRef.current === 0;
    if (isPlayingRef.current) {
      void audio.play().catch(() => {
        isPlayingRef.current = false;
        setIsPlaying(false);
      });
    }
  }, [activeSrc]);

  useEffect(() => {
    if (!isVolumeOpen) return undefined;
    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && volumeGroupRef.current?.contains(target)) return;
      setIsVolumeOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsVolumeOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDownOutside, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDownOutside, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isVolumeOpen]);

  function persistVolume(next: number) {
    try {
      window.localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, String(next));
      window.dispatchEvent(new Event(MUSIC_VOLUME_EVENT));
    } catch {
      // Ignore storage quota or private browsing errors.
    }
  }

  function applyVolume(nextRaw: number) {
    const clamped = clampMusicVolume(nextRaw);
    if (clamped > 0) {
      lastNonZeroVolumeRef.current = clamped;
    }
    persistVolume(clamped);
  }

  function toggleMute() {
    if (effectiveVolume === 0) {
      const restored = lastNonZeroVolumeRef.current > 0 ? lastNonZeroVolumeRef.current : DEFAULT_MUSIC_VOLUME;
      persistVolume(restored);
      return;
    }
    lastNonZeroVolumeRef.current = effectiveVolume;
    persistVolume(0);
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
      return;
    }

    audio.volume = effectiveVolume;
    audio.muted = effectiveVolume === 0;
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
  const volumePercent = Math.round(effectiveVolume * 100);
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume <= 0.45 ? Volume1 : Volume2;

  return (
    <div
      data-testid={TEST_IDS.header.musicBar}
      aria-label={VI_MESSAGES.nav.musicPlayerAria}
      title={
        currentTrack
          ? `${currentTrack.title} | ${currentTrack.artist}`
          : VI_MESSAGES.nav.musicEmptyNotice
      }
      className="group relative flex min-h-10 max-w-full items-center gap-2 rounded-control border-2 border-border-strong bg-surface-subtle px-2 py-1 text-xs shadow-sm sm:max-w-[324px]"
    >
      {/* Ambient blurred glow behind card matching Spell Spotify Card aesthetic */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`absolute -top-4 -left-4 h-16 w-24 rounded-full bg-primary/45 blur-xl transition-opacity duration-300 ${
            effectivePlaying ? 'opacity-90' : 'opacity-35 group-hover:opacity-65'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-subtle/70 to-surface-subtle/95" />
      </div>

      {/* Album cover tile + sliding grooved black vinyl record with mr-6 so vinyl never collides with text */}
      <button
        type="button"
        disabled={!hasTracks}
        onClick={togglePlayPause}
        aria-label={
          effectivePlaying ? VI_MESSAGES.nav.musicPauseAria : VI_MESSAGES.nav.musicPlayAria
        }
        className="relative z-10 mr-6 flex shrink-0 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-signal disabled:cursor-default"
      >
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
            effectivePlaying ? 'translate-x-2.5' : '-translate-x-1 group-hover:translate-x-2.5'
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
      </button>

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

      {/* 4 Compact Controls: Prev / Play-Pause / Next / Volume */}
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

        <div
          ref={volumeGroupRef}
          onMouseEnter={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
              setIsVolumeOpen(true);
            }
          }}
          onMouseLeave={() => {
            if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
              setIsVolumeOpen(false);
            }
          }}
          onFocus={() => setIsVolumeOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsVolumeOpen(false);
            }
          }}
          className="relative"
        >
          <button
            type="button"
            disabled={!hasTracks}
            onClick={(event) => {
              const isTouchTap =
                typeof window !== 'undefined' &&
                !window.matchMedia('(hover: hover)').matches &&
                event.detail > 0;
              if (isTouchTap && !isVolumeOpen) {
                setIsVolumeOpen(true);
                return;
              }
              toggleMute();
            }}
            aria-label={
              effectiveVolume === 0
                ? VI_MESSAGES.nav.musicUnmuteAria
                : `${VI_MESSAGES.nav.musicVolumeAria} (${volumePercent}%)`
            }
            aria-expanded={isVolumeOpen}
            aria-haspopup="dialog"
            data-testid={TEST_IDS.header.musicVolumeToggle}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <VolumeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          {isVolumeOpen && hasTracks ? (
            <div className="absolute top-full right-0 z-50 pt-1.5">
              <div
                role="dialog"
                aria-label={VI_MESSAGES.nav.musicVolumeAria}
                data-testid={TEST_IDS.header.musicVolumePopover}
                className="mtx-shadow flex w-48 items-center gap-2 rounded-control border-2 border-border-strong bg-surface-elevated px-2.5 py-2 text-ink"
              >
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={
                    effectiveVolume === 0
                      ? VI_MESSAGES.nav.musicUnmuteAria
                      : VI_MESSAGES.nav.musicMuteAria
                  }
                  className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink"
                >
                  <VolumeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volumePercent}
                  aria-label={VI_MESSAGES.nav.musicVolumeSliderAria}
                  aria-valuetext={`${volumePercent}%`}
                  data-testid={TEST_IDS.header.musicVolumeSlider}
                  onChange={(event) => applyVolume(Number(event.target.value) / 100)}
                  className="h-1.5 w-full min-w-0 cursor-pointer accent-primary"
                />
                <span className="w-8 shrink-0 text-right font-mono text-[11px] font-bold tabular-nums text-accent-ink">
                  {volumePercent}%
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={currentTrack?.src}
        preload="metadata"
        onLoadedMetadata={(event) => {
          event.currentTarget.volume = effectiveVolume;
          event.currentTarget.muted = effectiveVolume === 0;
        }}
        onEnded={() => stepTrack(1, true)}
      />
    </div>
  );
}
