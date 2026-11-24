export function isReloadNavigationType(type?: string | null): boolean {
  return type === 'reload';
}

export function readNavigationType(): string | undefined {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return undefined;
  }
  const entry = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type;
}

/** Reset scroll position when landing on `/` (reload or direct visit), leaving back_forward history intact. */
export function shouldResetLandingScroll(
  pathname: string | null | undefined,
  navType?: string | null,
): boolean {
  return pathname === '/' && navType !== 'back_forward';
}

/**
 * Synchronous head script run before browser layout/scroll restoration so F5 on `/`
 * starts at the Hero section (y = 0) instead of restoring mid-page scroll or `#featured-*` hashes.
 */
export function getLandingScrollInitScript(): string {
  return `(function(){try{if(window.location.pathname!=='/')return;var e=typeof performance!=='undefined'&&performance.getEntriesByType?performance.getEntriesByType('navigation')[0]:null;var t=e&&e.type;if(t==='back_forward')return;if('scrollRestoration' in window.history){window.history.scrollRestoration='manual';}if(t==='reload'&&window.location.hash){window.history.replaceState(null,'',window.location.pathname+window.location.search);}window.scrollTo(0,0);}catch(_e){}})();`;
}

export function resetLandingScrollIfNeeded(pathname: string | null | undefined): void {
  if (typeof window === 'undefined') return;
  const navType = readNavigationType();
  if (!shouldResetLandingScroll(pathname, navType)) return;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  if (isReloadNavigationType(navType) && window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
