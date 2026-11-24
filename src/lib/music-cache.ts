import type { MusicPlaylistResponse, MusicTrack } from '@/shared/types';

let cachedTracks: MusicTrack[] | null = null;
let inFlightRequest: Promise<MusicTrack[]> | null = null;

function withAbortGuard<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

/**
 * Fetch and share `/api/music` tracks across Preloader and MusicPlayerBar
 * without requiring a QueryClient wrapper in standalone component tests.
 */
export function fetchCachedMusicTracks(signal?: AbortSignal): Promise<MusicTrack[]> {
  if (cachedTracks !== null) {
    return withAbortGuard(Promise.resolve(cachedTracks), signal);
  }

  if (!inFlightRequest) {
    inFlightRequest = fetch('/api/music')
      .then(async (res) => {
        if (!res.ok) return [] as MusicTrack[];
        const payload = (await res.json()) as Partial<MusicPlaylistResponse>;
        if (!Array.isArray(payload.tracks)) return [] as MusicTrack[];
        cachedTracks = payload.tracks;
        return payload.tracks;
      })
      .catch(() => [] as MusicTrack[])
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return withAbortGuard(inFlightRequest, signal);
}

/** Clear cached track list (intended for unit tests). */
export function resetMusicTracksCache(): void {
  cachedTracks = null;
  inFlightRequest = null;
}
