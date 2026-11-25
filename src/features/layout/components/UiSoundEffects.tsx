'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useSyncExternalStore } from 'react';
import {
  getUiSfxServerSnapshot,
  getUiSfxSnapshot,
  playUiSound,
  readUiSfxEnabled,
  setUiSfxEnabled,
  subscribeUiSfx,
  warmUiAudio,
  type UiSoundKind,
} from '@/lib/ui-sound';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

const INTERACTIVE_SELECTOR =
  'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="option"], summary, input[type="radio"], input[type="checkbox"]';

function resolveSoundKind(value: string | null): UiSoundKind {
  if (value === 'toggle' || value === 'success' || value === 'modal') {
    return value;
  }
  return 'click';
}

function findInteractiveTarget(rawTarget: EventTarget | null): HTMLElement | null {
  if (!(rawTarget instanceof Element)) return null;
  const interactive = rawTarget.closest<HTMLElement>(INTERACTIVE_SELECTOR);
  if (!interactive) return null;
  if (
    interactive.matches(':disabled') ||
    interactive.getAttribute('aria-disabled') === 'true' ||
    interactive.getAttribute('data-sfx') === 'none'
  ) {
    return null;
  }
  return interactive;
}

/**
 * Global delegated click-SFX listener mounted once inside AppShell.
 * Fires on `pointerdown` for mouse/pen presses (0ms mechanical latency) and falls back
 * to `click` for touch taps and keyboard activations, skipping duplicate triggers.
 */
export function UiSoundEffects() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    let lastPointerSoundAt = 0;
    let lastPointerTarget: HTMLElement | null = null;

    const handleWarmup = () => {
      warmUiAudio();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!readUiSfxEnabled()) return;
      warmUiAudio();

      if (event.pointerType === 'touch') return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const interactive = findInteractiveTarget(event.target);
      if (!interactive) return;

      lastPointerSoundAt = performance.now();
      lastPointerTarget = interactive;
      playUiSound(resolveSoundKind(interactive.getAttribute('data-sfx')));
    };

    const handleClick = (event: MouseEvent) => {
      if (!readUiSfxEnabled()) return;
      const interactive = findInteractiveTarget(event.target);
      if (!interactive) return;

      const now = performance.now();
      if (
        event.detail > 0 &&
        lastPointerTarget === interactive &&
        now - lastPointerSoundAt < 500
      ) {
        lastPointerTarget = null;
        return;
      }

      playUiSound(resolveSoundKind(interactive.getAttribute('data-sfx')));
    };

    document.addEventListener('keydown', handleWarmup, { capture: true, once: true, passive: true });
    document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: true });
    document.addEventListener('click', handleClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('keydown', handleWarmup, { capture: true });
      document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, []);

  return null;
}

export function SfxToggle({ testId = TEST_IDS.header.sfxToggle }: { testId?: string } = {}) {
  const enabled = useSyncExternalStore(
    subscribeUiSfx,
    getUiSfxSnapshot,
    getUiSfxServerSnapshot,
  );
  const label = enabled ? VI_MESSAGES.nav.sfxOnAria : VI_MESSAGES.nav.sfxOffAria;

  function handleToggle() {
    const next = !enabled;
    setUiSfxEnabled(next);
    if (next) {
      playUiSound('toggle', { force: true });
    }
  }

  return (
    <button
      type="button"
      data-sfx="none"
      aria-pressed={enabled}
      aria-label={label}
      title={label}
      data-testid={testId}
      onClick={handleToggle}
      className={`mtx-shadow-sm inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-control border-2 px-2 font-mono text-xs font-bold tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
        enabled
          ? 'border-border-strong bg-surface-subtle text-ink hover:border-signal hover:text-accent-ink'
          : 'border-border bg-surface text-ink-muted hover:border-border-strong hover:text-ink'
      }`}
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
      ) : (
        <VolumeX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{VI_MESSAGES.nav.sfxShortLabel}</span>
    </button>
  );
}
