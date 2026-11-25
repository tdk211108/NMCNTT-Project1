'use client';

import { QueryClientContext } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePrefersReducedMotion } from '@/lib/client-hooks';
import { resetLandingScrollIfNeeded } from '@/lib/landing-scroll';
import { preloadEssentialAssets, type PreloaderStage } from '@/lib/preloader';
import { PRELOADER_FAILSAFE_TIMEOUT_MS } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

const PreloaderReadyContext = createContext<boolean>(true);
const PreloaderDismissedContext = createContext<boolean>(true);

export function usePreloaderReady(): boolean {
  return useContext(PreloaderReadyContext);
}

/** True after the preloader exit transition finishes and the overlay unmounts. */
export function usePreloaderDismissed(): boolean {
  return useContext(PreloaderDismissedContext);
}

const STAGE_LABEL_MAP: Record<PreloaderStage, string> = {
  assets: VI_MESSAGES.preloader.statusAssets,
  catalog: VI_MESSAGES.preloader.statusCatalog,
  media: VI_MESSAGES.preloader.statusMedia,
  ready: VI_MESSAGES.preloader.statusReady,
};

export interface SitePreloaderProps {
  onComplete?: () => void;
  onDismissed?: () => void;
}

/**
 * Full-viewport 3D Crimson Pyramid startup loader overlay.
 * Renders visibly from SSR/first paint until essential page assets, Hero showcase
 * video, and active music track are ready (or the 12s fail-safe expires).
 */
export function SitePreloader({ onComplete, onDismissed }: SitePreloaderProps) {
  const pathname = usePathname();
  const queryClient = useContext(QueryClientContext);
  const prefersReduced = usePrefersReducedMotion();

  const [displayPercent, setDisplayPercent] = useState(0);
  const [stage, setStage] = useState<PreloaderStage>('assets');
  const [closing, setClosing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const targetRatioRef = useRef(0);
  const assetsDoneRef = useRef(false);
  const prevOverflowRef = useRef<string>('');
  const onCompleteRef = useRef(onComplete);
  const onDismissedRef = useRef(onDismissed);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onDismissedRef.current = onDismissed;
  }, [onDismissed]);

  useEffect(() => {
    if (dismissed || typeof document === 'undefined') return undefined;
    prevOverflowRef.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prevOverflowRef.current;
    };
  }, [dismissed]);

  useEffect(() => {
    let active = true;
    let rafId: number | null = null;
    let holdTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let currentDisplay = 0;

    void preloadEssentialAssets({
      pathname,
      queryClient,
      prefersReducedMotion: prefersReduced,
      timeoutMs: PRELOADER_FAILSAFE_TIMEOUT_MS,
      onUpdate: (update) => {
        if (!active) return;
        targetRatioRef.current = Math.max(targetRatioRef.current, update.progress);
        setStage(update.stage);
      },
    }).then(() => {
      if (!active) return;
      targetRatioRef.current = 1;
      assetsDoneRef.current = true;
      setStage('ready');
    });

    const beginExit = async () => {
      if (!active) return;
      setClosing(true);
      onCompleteRef.current?.();
      if (typeof document !== 'undefined') {
        document.documentElement.style.overflow = prevOverflowRef.current;
      }
      resetLandingScrollIfNeeded(pathname);

      const overlay = overlayRef.current;
      const animations = overlay && typeof overlay.getAnimations === 'function'
        ? overlay.getAnimations()
        : [];
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((anim) => anim.finished)),
          new Promise<void>((resolve) => setTimeout(resolve, 480)),
        ]);
      }

      if (active) {
        setDismissed(true);
        onDismissedRef.current?.();
      }
    };

    const tick = () => {
      if (!active) return;
      const target = targetRatioRef.current;
      const stepFactor = assetsDoneRef.current
        ? prefersReduced
          ? 0.45
          : 0.24
        : 0.14;
      const diff = target - currentDisplay;

      if (assetsDoneRef.current && diff <= 0.008) {
        currentDisplay = 1;
        setDisplayPercent(100);
        holdTimeoutId = setTimeout(
          () => {
            void beginExit();
          },
          prefersReduced ? 60 : 180,
        );
        return;
      }

      currentDisplay = Math.min(target, currentDisplay + Math.max(diff * stepFactor, 0.004));
      const nextInt = Math.min(99, Math.max(0, Math.round(currentDisplay * 100)));
      setDisplayPercent(assetsDoneRef.current && nextInt >= 99 ? 99 : nextInt);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      active = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (holdTimeoutId !== null) clearTimeout(holdTimeoutId);
    };
    // Run once on initial mount so client-side navigation never re-blocks the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (dismissed) {
    return null;
  }

  return (
    <>
      <noscript>
        <style>{`[data-testid="${TEST_IDS.layout.preloader}"]{display:none!important}`}</style>
      </noscript>
      <div
        ref={overlayRef}
        data-testid={TEST_IDS.layout.preloader}
        data-closing={closing ? 'true' : 'false'}
        aria-modal="true"
        role="dialog"
        aria-label={VI_MESSAGES.preloader.progressAria}
        className="mtx-site-preloader mtx-blueprint-grid fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg px-4 text-ink"
      >
        <div
          aria-hidden="true"
          className="mtx-crt-scanlines pointer-events-none absolute inset-0 opacity-45"
        />

        <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
          <p className="mb-1 border-l-4 border-primary pl-2.5 font-mono text-[11px] font-bold tracking-[0.2em] text-accent-ink uppercase">
            {VI_MESSAGES.preloader.tag}
          </p>

          <div className="mtx-pyramid-loader" aria-hidden="true">
            <div className="mtx-pyramid-wrapper">
              <span className="mtx-pyramid-side mtx-pyramid-side-1" />
              <span className="mtx-pyramid-side mtx-pyramid-side-2" />
              <span className="mtx-pyramid-side mtx-pyramid-side-3" />
              <span className="mtx-pyramid-side mtx-pyramid-side-4" />
              <span className="mtx-pyramid-shadow" />
            </div>
          </div>

          <div className="mt-2 flex w-[min(22rem,calc(100vw-2rem))] flex-col items-center gap-2.5">
            <div className="mtx-shadow-sm w-full rounded-control border-2 border-border-strong bg-surface p-1">
              <progress
                data-testid={TEST_IDS.layout.preloaderProgress}
                className="mtx-preloader-progress block h-2.5 w-full"
                max={100}
                value={displayPercent}
                aria-label={VI_MESSAGES.preloader.progressAria}
              />
            </div>

            <p
              data-testid={TEST_IDS.layout.preloaderPercent}
              className="font-mono text-2xl font-bold tracking-wider tabular-nums text-ink"
            >
              {displayPercent}%
            </p>

            <p
              role="status"
              aria-live="polite"
              data-testid={TEST_IDS.layout.preloaderStatus}
              className="text-center font-mono text-[11px] font-medium tracking-wide text-ink-muted"
            >
              {STAGE_LABEL_MAP[stage]}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/** Coordinates preloader readiness state so landing showcase animations wait for reveal. */
export function PreloaderProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  return (
    <PreloaderReadyContext.Provider value={isReady}>
      <PreloaderDismissedContext.Provider value={isDismissed}>
        <SitePreloader
          onComplete={() => setIsReady(true)}
          onDismissed={() => setIsDismissed(true)}
        />
        {children}
      </PreloaderDismissedContext.Provider>
    </PreloaderReadyContext.Provider>
  );
}
