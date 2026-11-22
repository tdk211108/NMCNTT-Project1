'use client';

import {
  ArrowRight,
  Cpu,
  Gauge,
  Pause,
  Play,
  Scale,
  Terminal,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DecryptedText } from '@/components/ui/DecryptedText';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { FocusPullCarousel } from '@/components/ui/FocusPullCarousel';
import { WIDE_CONTAINER_CLASS } from '@/features/layout/layout-width';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useHomeController } from '../useHomeController';

export type HomeViewProps = ReturnType<typeof useHomeController>;

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

export function HomeView({ state, actions }: HomeViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const prefersReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const [videoPlayOverride, setVideoPlayOverride] = useState<boolean | null>(null);
  const [tickerPauseOverride, setTickerPauseOverride] = useState<boolean | null>(null);
  const [carouselOriginMs, setCarouselOriginMs] = useState<number | null>(null);

  const handleCarouselClockStart = useCallback((originMs: number) => {
    setCarouselOriginMs((prev) => prev ?? originMs);
  }, []);

  const isVideoPlaying = videoPlayOverride ?? !prefersReduced;
  const isTickerPaused = tickerPauseOverride ?? prefersReduced;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVideoPlaying) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          setVideoPlayOverride(false);
        });
      }
    } else {
      video.pause();
    }
  }, [isVideoPlaying]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const root = rootRef.current;
    const heroWrapper = heroWrapperRef.current;
    if (!root || !heroWrapper) return;

    const sectionNodes = Array.from(
      root.querySelectorAll<HTMLElement>('.parallax-section-rise'),
    );
    const activeNodes = new Set<Element>();
    let rafId: number | null = null;
    let listeningScroll = false;

    const updateTransforms = () => {
      rafId = null;

      if (activeNodes.has(heroWrapper) && frontLayerRef.current) {
        const rect = heroWrapper.getBoundingClientRect();
        const progress =
          rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
        frontLayerRef.current.style.transform = `translate3d(0, ${(-20 * progress).toFixed(1)}px, 0)`;
      }

      const entrySpan = Math.max(1, window.innerHeight * 0.35);
      for (const node of sectionNodes) {
        if (!activeNodes.has(node)) continue;
        const rect = node.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / entrySpan));
        node.style.transform = `translate3d(0, ${((1 - progress) * 24).toFixed(1)}px, 0)`;
        node.style.opacity = (0.92 + 0.08 * progress).toFixed(3);
      }
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(updateTransforms);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeNodes.add(entry.target);
          } else {
            activeNodes.delete(entry.target);
          }
        }

        if (activeNodes.size > 0 && !listeningScroll) {
          window.addEventListener('scroll', scheduleUpdate, { passive: true });
          listeningScroll = true;
          scheduleUpdate();
        } else if (activeNodes.size === 0 && listeningScroll) {
          window.removeEventListener('scroll', scheduleUpdate);
          listeningScroll = false;
        }
      },
      { threshold: 0 },
    );

    observer.observe(heroWrapper);
    for (const node of sectionNodes) {
      observer.observe(node);
    }
    updateTransforms();

    return () => {
      observer.disconnect();
      if (listeningScroll) {
        window.removeEventListener('scroll', scheduleUpdate);
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [state.isLoading]);

  function onToggleVideo() {
    setVideoPlayOverride(!isVideoPlaying);
  }

  const subtitleParts = VI_MESSAGES.home.heroSubtitle.split('Precision-engineered');

  return (
    <div ref={rootRef} className="flex flex-col">
      <div className="flex w-full flex-col">
        <section
          ref={heroWrapperRef}
          className="parallax-hero-wrapper hero-dark-stage relative flex min-h-[clamp(24rem,68dvh,38rem)] w-full items-end overflow-clip bg-bg md:min-h-[clamp(28rem,calc(100dvh-10.5rem),66rem)]"
        >
          {/* Background video feathered tightly on the left edge so bottom 1/4 & video captions stay bright */}
          <div
            aria-hidden="true"
            className="hero-video-mask pointer-events-none absolute inset-y-0 right-0 z-0 w-full md:w-[82%] lg:w-[82%]"
          >
            <video
              ref={videoRef}
              src="/ROG-Matrix-GeForce-SnapYT.App.webm"
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={VI_MESSAGES.home.heroCrtChannelLabel}
              className="block h-full w-full object-cover object-center"
            />
            <div className="mtx-crt-scanlines pointer-events-none absolute inset-0" />
          </div>

          {/* Localized contrast scrim behind upper/mid headline & CTAs leaving bottom 1/4 un-dimmed */}
          <div
            aria-hidden="true"
            className="hero-video-fade pointer-events-none absolute inset-0 z-[1]"
          />

          <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12">
            <div
              ref={frontLayerRef}
              className="parallax-layer-front flex w-full max-w-2xl flex-col items-start pt-12 pb-24 text-left sm:pb-32 lg:pb-[clamp(8.5rem,24dvh,14.5rem)]"
            >
              <h1 className="font-display text-[clamp(2.35rem,1.4rem+3.8vw,4.85rem)] leading-[1.02] font-bold tracking-tight text-ink uppercase text-balance">
                <DecryptedText
                  text={VI_MESSAGES.home.heroTitleLine1}
                  speed={65}
                  maxIterations={12}
                  animateOn="view"
                  effect="fade"
                  hoverRadius={56}
                  className="block"
                />
                <DecryptedText
                  text={VI_MESSAGES.home.heroTitleLine2}
                  speed={105}
                  maxIterations={16}
                  animateOn="view"
                  effect="fade"
                  hoverRadius={56}
                  className="block text-accent-ink"
                />
              </h1>

              <p className="mt-5 max-w-2xl text-[clamp(1rem,0.92rem+0.42vw,1.28rem)] leading-relaxed text-ink-muted text-pretty">
                {subtitleParts.length === 2 ? (
                  <>
                    {subtitleParts[0]}
                    <span className="whitespace-nowrap">Precision-engineered</span>
                    {subtitleParts[1]}
                  </>
                ) : (
                  VI_MESSAGES.home.heroSubtitle
                )}
              </p>

              <p className="mt-4 border-l-4 border-primary pl-3 font-mono text-xs font-bold tracking-[0.22em] text-accent-ink">
                {VI_MESSAGES.home.heroRetailerLabel}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#featured-cpu"
                  data-testid={TEST_IDS.home.heroScrollCta}
                  className="mtx-shadow-sm inline-flex min-h-11 items-center justify-center gap-2 rounded-control border-2 border-border-strong bg-primary px-5 py-2.5 text-sm font-bold text-primary-fg hover:bg-[var(--color-primary-hover)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
                >
                  <span>{VI_MESSAGES.home.heroScrollCta}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </a>
                <Link href="/cpu" data-testid={TEST_IDS.home.browseCpu}>
                  <Button variant="outline">
                    <Cpu className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{VI_MESSAGES.home.viewAllCpu}</span>
                  </Button>
                </Link>
                <Link href="/gpu" data-testid={TEST_IDS.home.browseGpu}>
                  <Button variant="outline">
                    <Zap className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{VI_MESSAGES.home.viewAllGpu}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-4 bottom-3 left-4 z-20 flex justify-start sm:right-24 sm:bottom-4 sm:left-auto">
            <div className="pointer-events-auto flex flex-wrap items-center gap-2 border-2 border-border-strong bg-black/90 px-2.5 py-1.5 font-mono text-xs">
              <span
                aria-hidden="true"
                className={`inline-block h-2 w-2 ${isVideoPlaying ? 'bg-signal' : 'bg-gunmetal'}`}
              />
              <span className="font-bold text-ink">
                {isVideoPlaying
                  ? VI_MESSAGES.home.heroCrtStatusLive
                  : VI_MESSAGES.home.heroCrtStatusPaused}
              </span>
              <span className="hidden text-ink-muted sm:inline">
                {VI_MESSAGES.home.heroCrtChannelLabel}
              </span>
              <button
                type="button"
                onClick={onToggleVideo}
                data-testid={TEST_IDS.home.crtToggle}
                aria-label={
                  isVideoPlaying ? VI_MESSAGES.home.crtPauseVideo : VI_MESSAGES.home.crtPlayVideo
                }
                className="inline-flex min-h-8 cursor-pointer items-center gap-1 border border-border-strong bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
              >
                {isVideoPlaying ? (
                  <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{isVideoPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>
            </div>
          </div>
        </section>

        <div className="mtx-marquee flex w-full items-center border-y-2 border-border-strong bg-surface">
          <button
            type="button"
            onClick={() => setTickerPauseOverride(!isTickerPaused)}
            data-testid={TEST_IDS.home.tickerToggle}
            aria-label={isTickerPaused ? VI_MESSAGES.home.tickerPlay : VI_MESSAGES.home.tickerPause}
            className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 border-r-2 border-border-strong bg-primary px-3 font-mono text-xs font-bold text-primary-fg hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-signal"
          >
            {isTickerPaused ? (
              <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isTickerPaused ? 'PLAY' : 'HOLD'}</span>
          </button>
          <div className="flex-1 overflow-hidden py-2 font-mono text-xs font-semibold tracking-widest text-ink">
            <div className="mtx-marquee-track" data-paused={isTickerPaused ? 'true' : 'false'}>
              <span className="shrink-0 pr-12">{VI_MESSAGES.home.tickerLine}</span>
              <span aria-hidden="true" className="shrink-0 pr-12">
                {VI_MESSAGES.home.tickerLine}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${WIDE_CONTAINER_CLASS} flex flex-col gap-10 pt-8`}>
        <div id="featured-cpu" className="scroll-mt-24">
        {state.isLoading ? (
          <Spinner />
        ) : state.errorMessage ? (
          <EmptyState
            title={state.errorMessage}
            action={
              <Button variant="primary" onClick={actions.onRetry}>
                {VI_MESSAGES.common.retry}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-10">
            <section
              data-testid={TEST_IDS.home.featuredCpuSection}
              className="parallax-section-rise flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary pl-3">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-accent-ink">
                    01 // CENTRAL PROCESSORS
                  </p>
                  <h2 className="font-display text-2xl font-bold text-ink uppercase">
                    {VI_MESSAGES.home.featuredCpuTitle}
                  </h2>
                  <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseCpuDesc}</p>
                </div>
                <Link href="/cpu" data-testid={TEST_IDS.home.featuredCpuAll}>
                  <Button variant="outline" size="sm">
                    <span>{VI_MESSAGES.home.viewAllCpu}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                </Link>
              </div>

              <FocusPullCarousel
                category="cpu"
                items={state.cpus}
                autoplayMs={2000}
                phaseOffsetMs={0}
                clockOriginMs={carouselOriginMs}
                onClockStart={handleCarouselClockStart}
                loop
              />
            </section>

            <section
              id="featured-gpu"
              data-testid={TEST_IDS.home.featuredGpuSection}
              className="parallax-section-rise flex flex-col gap-4 scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary pl-3">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-accent-ink">
                    02 // GRAPHICS PROCESSORS
                  </p>
                  <h2 className="font-display font-bold text-2xl text-ink uppercase">
                    {VI_MESSAGES.home.featuredGpuTitle}
                  </h2>
                  <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseGpuDesc}</p>
                </div>
                <Link href="/gpu" data-testid={TEST_IDS.home.featuredGpuAll}>
                  <Button variant="outline" size="sm">
                    <span>{VI_MESSAGES.home.viewAllGpu}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </Button>
                </Link>
              </div>

              <FocusPullCarousel
                category="gpu"
                items={state.gpus}
                autoplayMs={2000}
                phaseOffsetMs={1000}
                clockOriginMs={carouselOriginMs}
                onClockStart={handleCarouselClockStart}
                loop
              />
            </section>
          </div>
        )}
      </div>

      <section className="parallax-section-rise flex flex-col gap-4">
        <div className="border-l-4 border-primary pl-3">
          <p className="font-mono text-xs font-bold tracking-widest text-accent-ink">
            03 // DIAGNOSTIC SUITE
          </p>
          <h2 className="font-display text-xl font-bold text-ink uppercase">
            {VI_MESSAGES.home.toolsHeading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:gap-5">
          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-accent-ink">TOOL // 01</span>
                <Scale className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-ink">{VI_MESSAGES.tools.compare.title}</h3>
              <p className="text-sm text-ink-muted">{VI_MESSAGES.home.compareShortcutDesc}</p>
            </div>
            <div>
              <Link href="/compare" data-testid={TEST_IDS.home.toolCompare}>
                <Button variant="outline" size="sm">
                  <span>{VI_MESSAGES.nav.compare}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-accent-ink">TOOL // 02</span>
                <Terminal className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-ink">
                {VI_MESSAGES.tools.perfPerPrice.title}
              </h3>
              <p className="text-sm text-ink-muted">{VI_MESSAGES.home.pppShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/perf-per-price" data-testid={TEST_IDS.home.toolPpp}>
                <Button variant="outline" size="sm">
                  <span>{VI_MESSAGES.nav.perfPerPrice}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-accent-ink">TOOL // 03</span>
                <Gauge className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-ink">{VI_MESSAGES.tools.psu.title}</h3>
              <p className="text-sm text-ink-muted">{VI_MESSAGES.home.psuShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/psu" data-testid={TEST_IDS.home.toolPsu}>
                <Button variant="outline" size="sm">
                  <span>{VI_MESSAGES.nav.psu}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
      </div>
    </div>
  );
}
