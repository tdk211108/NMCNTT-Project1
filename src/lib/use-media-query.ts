'use client';

import { useCallback, useSyncExternalStore } from 'react';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';
const COMPACT_DESKTOP_QUERY = '(max-width: 1023px)';

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
      }
      const mql = window.matchMedia(query);
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', onStoreChange);
        return () => mql.removeEventListener('change', onStoreChange);
      }
      mql.addListener(onStoreChange);
      return () => mql.removeListener(onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/**
 * Tracks `< 768px` (`md` breakpoint) client-side while defaulting SSR to desktop (`false`)
 * so mobile and desktop trees never mount duplicate `data-testid` instances simultaneously.
 */
export function useIsMobileViewport(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}

/** Tracks `< 1024px` (`lg` breakpoint) client-side for collapsible catalog filter drawers. */
export function useIsBelowLgViewport(): boolean {
  return useMediaQuery(COMPACT_DESKTOP_QUERY);
}
