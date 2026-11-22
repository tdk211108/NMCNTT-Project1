'use client';

import { Cloud, Moon, Star, Sun } from 'lucide-react';
import { type MouseEvent, useRef } from 'react';
import { flushSync } from 'react-dom';
import { applyTheme, notifyThemeChange, type ThemeMode } from '@/lib/theme';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useThemeMode } from './useThemeMode';

const WAVE_RIPPLE_DURATION_MS = 600;

export function ThemeToggle({ testId = TEST_IDS.header.themeToggle }: { testId?: string } = {}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mode = useThemeMode();
  const isDark = mode === 'dark';
  const label = isDark ? VI_MESSAGES.nav.toggleThemeToLight : VI_MESSAGES.nav.toggleThemeToDark;

  function onToggle(event: MouseEvent<HTMLButtonElement>) {
    const next: ThemeMode = isDark ? 'light' : 'dark';
    const commitTheme = () => {
      applyTheme(next);
      notifyThemeChange();
    };

    const supportsRipple =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!supportsRipple) {
      commitTheme();
      return;
    }

    const triggerEl = buttonRef.current ?? event.currentTarget;
    const rect = triggerEl.getBoundingClientRect();
    const x = event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
    const y = event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(commitTheme);
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: WAVE_RIPPLE_DURATION_MS,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {
        // Theme DOM state is already applied inside startViewTransition callback.
      });
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      data-sfx="toggle"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={onToggle}
      className={`relative inline-flex h-8 w-[52px] shrink-0 cursor-pointer items-center overflow-hidden rounded-full border-2 border-border-strong p-1 transition-colors duration-500 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none sm:h-9 sm:w-[68px] ${
        isDark ? 'bg-slate-900' : 'bg-sky-300'
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-full"
      >
        <span
          className={`absolute inset-0 flex items-center justify-end pr-1.5 transition-all duration-400 motion-reduce:transition-none sm:pr-2 ${
            isDark ? 'translate-y-2.5 opacity-0' : 'translate-y-0 opacity-100'
          }`}
        >
          <Cloud className="h-3.5 w-3.5 fill-white/80 text-white/80 sm:h-4.5 sm:w-4.5" />
        </span>

        <span
          className={`absolute inset-0 flex items-center justify-start pl-1.5 transition-all duration-400 motion-reduce:transition-none sm:pl-2 ${
            isDark ? 'translate-y-0 opacity-100' : '-translate-y-2.5 opacity-0'
          }`}
        >
          <span className="relative h-full w-full">
            <Star className="absolute top-1 left-1.5 h-1.5 w-1.5 fill-yellow-100 text-yellow-100 opacity-75 sm:left-2" />
            <Star className="absolute bottom-1.5 left-3.5 h-2 w-2 fill-yellow-100 text-yellow-100 opacity-55 sm:left-4.5" />
            <Star className="absolute top-2.5 left-5.5 h-1.5 w-1.5 fill-yellow-100 text-yellow-100 opacity-90 sm:left-7" />
          </span>
        </span>
      </span>

      <span
        aria-hidden="true"
        className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full shadow-md transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none sm:h-6 sm:w-6 ${
          isDark
            ? 'translate-x-5 bg-slate-800 sm:translate-x-8'
            : 'translate-x-0 bg-yellow-400'
        }`}
      >
        <span className="relative flex h-full w-full items-center justify-center">
          <Sun
            className={`absolute h-3.5 w-3.5 fill-white/20 text-white transition-all duration-400 motion-reduce:transition-none sm:h-4 sm:w-4 ${
              isDark ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
            }`}
          />
          <Moon
            className={`absolute h-3.5 w-3.5 fill-yellow-200 text-yellow-200 transition-all duration-400 motion-reduce:transition-none sm:h-4 sm:w-4 ${
              isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'
            }`}
          />
        </span>
      </span>
    </button>
  );
}
