'use client';

import { InnerMoon } from '@theme-toggles/react';
import { useSyncExternalStore } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

const STORAGE_KEY = 'techcore-theme';
const THEME_EVENT = 'techcore-theme-change';

function getOsPrefersDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readStoredPin(): 'light' | 'dark' | null {
  try {
    const val = window.localStorage.getItem(STORAGE_KEY);
    return val === 'light' || val === 'dark' ? val : null;
  } catch {
    return null;
  }
}

function resolveRenderedIsDark(): boolean {
  const pin = readStoredPin();
  if (pin === 'dark') return true;
  if (pin === 'light') return false;
  return getOsPrefersDark();
}

function applyThemeToDom(isDark: boolean, pin: 'light' | 'dark' | null): void {
  document.documentElement.classList.toggle('dark', isDark);
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', pin ?? 'light dark');
  }
}

function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const handleOsChange = () => {
    // Only follow OS passively when user has not pinned an explicit scheme.
    if (readStoredPin() === null) {
      applyThemeToDom(media.matches, null);
    }
    callback();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      applyThemeToDom(resolveRenderedIsDark(), readStoredPin());
      callback();
    }
  };

  const handleInternal = () => callback();

  media.addEventListener('change', handleOsChange);
  window.addEventListener('storage', handleStorage);
  window.addEventListener(THEME_EVENT, handleInternal);

  return () => {
    media.removeEventListener('change', handleOsChange);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(THEME_EVENT, handleInternal);
  };
}

function getClientSnapshot(): boolean {
  return resolveRenderedIsDark();
}

function getServerSnapshot(): undefined {
  return undefined;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  function commitThemeFlip() {
    const currentlyDark = resolveRenderedIsDark();
    const targetDark = !currentlyDark;
    const osDark = getOsPrefersDark();

    // Two-state rule: store explicit override only when diverging from OS; clear when matching OS.
    const nextPin: 'light' | 'dark' | null =
      targetDark === osDark ? null : targetDark ? 'dark' : 'light';

    try {
      if (nextPin) {
        window.localStorage.setItem(STORAGE_KEY, nextPin);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Safe fallback when storage is disabled; DOM update still proceeds.
    }

    applyThemeToDom(targetDark, nextPin);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const docWithTransition = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (!docWithTransition.startViewTransition || prefersReduced) {
      commitThemeFlip();
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = docWithTransition.startViewTransition(() => {
      commitThemeFlip();
    });

    void transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  }

  const label =
    isDark === undefined
      ? VI_MESSAGES.nav.themeToggleDefault
      : isDark
        ? VI_MESSAGES.nav.themeToggleToLight
        : VI_MESSAGES.nav.themeToggleToDark;

  return (
    <InnerMoon
      duration={500}
      toggled={isDark}
      onClick={handleClick}
      aria-label={label}
      title={label}
      data-testid={TEST_IDS.header.themeToggle}
      className="aero-glass inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-xl text-ink transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-border-strong active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    />
  );
}
