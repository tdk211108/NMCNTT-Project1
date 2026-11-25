import type { QueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchCachedMusicTracks } from '@/lib/music-cache';
import {
  BRAND_LOGO_MARK_LIGHT_PATH,
  BRAND_LOGO_MARK_PATH,
  HERO_VIDEO_PATH,
  MUSIC_PLAYER_ICON_PATH,
  PRELOADER_FAILSAFE_TIMEOUT_MS,
} from '@/shared/constants';
import type { FeaturedProductsResponse } from '@/shared/types';

export type PreloaderStage = 'assets' | 'catalog' | 'media' | 'ready';

export interface PreloaderProgressUpdate {
  progress: number;
  stage: PreloaderStage;
}

export interface PreloadTaskWeights {
  core: number;
  data: number;
  video: number;
  audio: number;
}

const TASK_WEIGHTS = {
  core: 0.2,
  data: 0.15,
  video: 0.45,
  audio: 0.2,
} as const;

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function computeWeightedProgress(weights: PreloadTaskWeights): number {
  const total =
    clampUnit(weights.core) * TASK_WEIGHTS.core +
    clampUnit(weights.data) * TASK_WEIGHTS.data +
    clampUnit(weights.video) * TASK_WEIGHTS.video +
    clampUnit(weights.audio) * TASK_WEIGHTS.audio;
  return clampUnit(total);
}

function resolvePreloaderStage(weights: PreloadTaskWeights): PreloaderStage {
  if (weights.core >= 1 && weights.data >= 1 && weights.video >= 1 && weights.audio >= 1) {
    return 'ready';
  }
  if (weights.core < 1) return 'assets';
  if (weights.data < 1) return 'catalog';
  return 'media';
}

function waitForWindowLoad(): Promise<void> {
  if (typeof document === 'undefined' || document.readyState === 'complete') {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

function preloadBrandImage(src: string): Promise<void> {
  if (typeof Image === 'undefined') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = new Image();
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    img.src = src;
    if (img.complete) {
      if (typeof img.decode === 'function') {
        void img.decode().catch(() => {}).finally(done);
      } else {
        done();
      }
    }
  });
}

async function waitForCoreAssets(): Promise<void> {
  const fontReady =
    typeof document !== 'undefined' && document.fonts?.ready
      ? document.fonts.ready.then(() => undefined).catch(() => undefined)
      : Promise.resolve();

  await Promise.all([
    waitForWindowLoad(),
    fontReady,
    preloadBrandImage(BRAND_LOGO_MARK_PATH),
    preloadBrandImage(BRAND_LOGO_MARK_LIGHT_PATH),
    preloadBrandImage(MUSIC_PLAYER_ICON_PATH),
  ]);
}

function readBufferedRatio(media: HTMLMediaElement): number {
  if (!Number.isFinite(media.duration) || media.duration <= 0 || media.buffered.length === 0) {
    return 0;
  }
  let maxEnd = 0;
  for (let i = 0; i < media.buffered.length; i += 1) {
    maxEnd = Math.max(maxEnd, media.buffered.end(i));
  }
  return Math.min(0.95, Math.max(0, maxEnd / media.duration));
}

function waitForVideoReady(
  src: string,
  prefersReducedMotion: boolean,
  onProgress: (ratio: number) => void,
): { promise: Promise<void>; cleanup: () => void } {
  if (typeof document === 'undefined') {
    onProgress(1);
    return { promise: Promise.resolve(), cleanup: () => {} };
  }

  const existing = document.querySelector<HTMLVideoElement>('video[data-hero-video="true"]');
  const video = existing ?? document.createElement('video');
  const ownsElement = !existing;
  const targetReadyState = prefersReducedMotion ? 2 : 4;
  const targetEvent = prefersReducedMotion ? 'loadeddata' : 'canplaythrough';

  if (ownsElement) {
    video.muted = true;
    video.playsInline = true;
    video.preload = prefersReducedMotion ? 'metadata' : 'auto';
    video.src = src;
  } else if (video.preload === 'metadata' && !prefersReducedMotion) {
    video.preload = 'auto';
  }

  if (video.readyState >= targetReadyState) {
    onProgress(1);
    return { promise: Promise.resolve(), cleanup: () => {} };
  }

  let settled = false;
  let cleanupListeners = () => {};

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      onProgress(1);
      resolve();
    };

    const handleProgress = () => {
      if (video.readyState >= targetReadyState) {
        finish();
        return;
      }
      onProgress(Math.max(0.15, readBufferedRatio(video)));
    };

    video.addEventListener('progress', handleProgress);
    video.addEventListener('loadeddata', handleProgress);
    video.addEventListener(targetEvent, finish, { once: true });
    video.addEventListener('error', finish, { once: true });

    if (video.readyState >= 1) {
      handleProgress();
    }

    cleanupListeners = () => {
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('loadeddata', handleProgress);
      video.removeEventListener(targetEvent, finish);
      video.removeEventListener('error', finish);
      if (ownsElement) {
        video.removeAttribute('src');
        video.load();
      }
    };
  });

  return { promise, cleanup: cleanupListeners };
}

function waitForAudioReady(
  src: string | undefined,
  onProgress: (ratio: number) => void,
): { promise: Promise<void>; cleanup: () => void } {
  if (!src || typeof document === 'undefined') {
    onProgress(1);
    return { promise: Promise.resolve(), cleanup: () => {} };
  }

  const audio = document.createElement('audio');
  audio.preload = 'auto';
  audio.src = src;

  let settled = false;
  let cleanupListeners = () => {};

  const promise = new Promise<void>((resolve) => {
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      onProgress(1);
      resolve();
    };

    const handleProgress = () => {
      if (audio.readyState >= 3) {
        finish();
        return;
      }
      onProgress(Math.max(0.2, readBufferedRatio(audio)));
    };

    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('canplay', finish, { once: true });
    audio.addEventListener('canplaythrough', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });

    if (audio.readyState >= 3) {
      finish();
    }

    cleanupListeners = () => {
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('canplay', finish);
      audio.removeEventListener('canplaythrough', finish);
      audio.removeEventListener('error', finish);
      audio.removeAttribute('src');
      audio.load();
    };
  });

  return { promise, cleanup: cleanupListeners };
}

export interface PreloadEssentialAssetsOptions {
  pathname: string | null;
  queryClient?: QueryClient;
  prefersReducedMotion?: boolean;
  timeoutMs?: number;
  onUpdate?: (update: PreloaderProgressUpdate) => void;
}

/**
 * Concurrently preload essential CoreRaster startup assets (document/fonts/icons,
 * `/api/music` + `/` featured products, hero showcase `.webm`, and active track audio)
 * with monotonic weighted progress reporting and a failsafe timeout.
 */
export async function preloadEssentialAssets({
  pathname,
  queryClient,
  prefersReducedMotion = false,
  timeoutMs = PRELOADER_FAILSAFE_TIMEOUT_MS,
  onUpdate,
}: PreloadEssentialAssetsOptions): Promise<void> {
  const weights: PreloadTaskWeights = { core: 0, data: 0, video: 0, audio: 0 };
  let highestProgress = 0;

  const emit = () => {
    const next = computeWeightedProgress(weights);
    if (next > highestProgress) {
      highestProgress = next;
    }
    onUpdate?.({
      progress: highestProgress,
      stage: resolvePreloaderStage(weights),
    });
  };

  let videoHandle: { promise: Promise<void>; cleanup: () => void } = {
    promise: Promise.resolve(),
    cleanup: () => {},
  };
  let audioHandle: { promise: Promise<void>; cleanup: () => void } = {
    promise: Promise.resolve(),
    cleanup: () => {},
  };
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const corePromise = waitForCoreAssets().then(() => {
    weights.core = 1;
    emit();
  });

  const featuredPromise =
    pathname === '/' && queryClient
      ? queryClient
          .prefetchQuery({
            queryKey: ['products', 'featured', 'landing'],
            queryFn: () => apiFetch<FeaturedProductsResponse>('/api/products/featured?preset=landing'),
          })
          .catch(() => undefined)
      : Promise.resolve();

  const tracksPromise = fetchCachedMusicTracks();

  const dataAndAudioPromise = Promise.all([tracksPromise, featuredPromise]).then(([tracks]) => {
    weights.data = 1;
    emit();

    audioHandle = waitForAudioReady(tracks[0]?.src, (ratio) => {
      weights.audio = Math.max(weights.audio, ratio);
      emit();
    });
    return audioHandle.promise;
  });

  if (pathname === '/') {
    videoHandle = waitForVideoReady(HERO_VIDEO_PATH, prefersReducedMotion, (ratio) => {
      weights.video = Math.max(weights.video, ratio);
      emit();
    });
  } else {
    weights.video = 1;
    emit();
  }

  const allWork = Promise.allSettled([corePromise, dataAndAudioPromise, videoHandle.promise]);
  const failsafe = new Promise<void>((resolve) => {
    timeoutId = setTimeout(resolve, Math.max(0, timeoutMs));
  });

  await Promise.race([allWork, failsafe]);

  if (timeoutId !== null) {
    clearTimeout(timeoutId);
  }
  videoHandle.cleanup();
  audioHandle.cleanup();

  weights.core = 1;
  weights.data = 1;
  weights.video = 1;
  weights.audio = 1;
  highestProgress = 1;
  onUpdate?.({ progress: 1, stage: 'ready' });
}
