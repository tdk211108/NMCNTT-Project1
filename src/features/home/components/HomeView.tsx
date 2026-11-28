'use client';

import {
  ArrowRight,
  Gauge,
  Layers,
  Scale,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DecryptedText } from './DecryptedText';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { FocusPullCarousel } from './FocusPullCarousel';
import { CpuIcon, GpuCardIcon } from '@/components/ui/Icons';
import { WIDE_CONTAINER_CLASS } from '@/features/layout/layout-width';
import { usePreloaderReady } from '@/features/layout/components/SitePreloader';
import { prefersReducedMotionNow, usePrefersReducedMotion } from '@/lib/client-hooks';
import { resetLandingScrollIfNeeded } from '@/lib/landing-scroll';
import { HERO_VIDEO_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useHomeController } from '../useHomeController';

export type HomeViewProps = ReturnType<typeof useHomeController>;

export function HomeView({ state, actions }: HomeViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const prefersReduced = usePrefersReducedMotion();
  const isPreloaderReady = usePreloaderReady();
  const [carouselOriginMs, setCarouselOriginMs] = useState<number | null>(null);

  const handleCarouselClockStart = useCallback((originMs: number) => {
    setCarouselOriginMs((prev) => prev ?? originMs);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const prevRestoration =
      'scrollRestoration' in window.history ? window.history.scrollRestoration : null;
    resetLandingScrollIfNeeded('/');
    return () => {
      if (prevRestoration && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = prevRestoration;
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!isPreloaderReady) {
      video.pause();
      return;
    }
    if (!prefersReduced) {
      if (video.currentTime > 0 && video.paused) {
        video.currentTime = 0;
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } else {
      video.pause();
    }
  }, [isPreloaderReady, prefersReduced]);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      CSS.supports('(animation-timeline: view()) and (animation-range: entry)') ||
      prefersReducedMotionNow()
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

  const subtitleParts = VI_MESSAGES.home.heroSubtitle.split('Precision-engineered');

  return (
    <div ref={rootRef} className="flex flex-col">
      <div className="flex w-full flex-col">
        <section
          ref={heroWrapperRef}
          className="parallax-hero-wrapper hero-dark-stage relative flex min-h-[max(28rem,calc(100dvh-var(--cr-header-h,3.5rem)-6.375rem))] w-full items-end overflow-clip bg-bg md:min-h-[max(32rem,calc(100dvh-var(--cr-header-h,8rem)-2.75rem))]"
        >
          {/* Full-bleed background video spanning 100% width and height across every viewport (mobile to 2K/4K/ultrawide) */}
          <div
            aria-hidden="true"
            className="hero-video-mask pointer-events-none absolute inset-0 z-0 h-full w-full"
          >
            <video
              ref={videoRef}
              src={HERO_VIDEO_PATH}
              data-hero-video="true"
              muted
              loop
              playsInline
              preload={prefersReduced ? 'metadata' : 'auto'}
              aria-label={VI_MESSAGES.home.heroCrtChannelLabel}
              className="block h-full w-full object-cover object-center"
            />
            <div className="mtx-crt-scanlines pointer-events-none absolute inset-0" />
          </div>

          {/* Responsive contrast scrim: bottom-up on mobile, subtle left scrim on desktop */}
          <div
            aria-hidden="true"
            className="hero-video-fade pointer-events-none absolute inset-0 z-[1]"
          />

          <div className="relative z-10 w-full px-4 sm:px-6 lg:px-12">
            <div
              ref={frontLayerRef}
              className="parallax-layer-front flex w-full max-w-2xl flex-col items-start pt-16 pb-6 text-left sm:pt-14 sm:pb-14 md:pb-[clamp(5.5rem,14dvh,10.5rem)]"
            >
              <h1 className="font-display text-[clamp(2.1rem,1.2rem+4.5vw,4.85rem)] leading-[1.02] font-bold tracking-tight text-ink uppercase text-balance">
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

              <p className="mt-3 max-w-xl text-[clamp(0.95rem,0.9rem+0.35vw,1.25rem)] leading-relaxed text-ink-muted text-pretty sm:mt-5">
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

              <p className="mt-3 border-l-4 border-primary pl-3 font-mono text-[11px] font-bold tracking-[0.2em] text-accent-ink sm:mt-4 sm:text-xs sm:tracking-[0.22em]">
                {VI_MESSAGES.home.heroRetailerLabel}
              </p>

              <div className="mt-5 grid w-full grid-cols-2 gap-2.5 sm:mt-8 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-4">
                <a
                  href="#featured-cpu"
                  data-testid={TEST_IDS.home.heroScrollCta}
                  className="mtx-cyber-btn mtx-cyber-primary col-span-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-2 px-4 py-2 text-sm font-bold tracking-wide motion-safe:transition-[transform,background-color,border-color,color] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:w-auto sm:px-4.5"
                >
                  <span aria-hidden="true" className="mtx-cyber-face" />
                  <span aria-hidden="true" className="mtx-cyber-tag">
                    01
                  </span>
                  <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                    <span>{VI_MESSAGES.home.heroScrollCta}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                  <span aria-hidden="true" className="mtx-cyber-glitch">
                    <span>{VI_MESSAGES.home.heroScrollCta}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </span>
                </a>
                <Link href="/cpu" data-testid={TEST_IDS.home.browseCpu} className="w-full sm:w-auto">
                  <Button variant="outline" cyberTag="02" className="w-full sm:w-auto">
                    <CpuIcon className="h-4 w-4" />
                    <span className="truncate">{VI_MESSAGES.home.viewAllCpu}</span>
                  </Button>
                </Link>
                <Link href="/gpu" data-testid={TEST_IDS.home.browseGpu} className="w-full sm:w-auto">
                  <Button variant="outline" cyberTag="03" className="w-full sm:w-auto">
                    <GpuCardIcon className="h-4 w-4" />
                    <span className="truncate">{VI_MESSAGES.home.viewAllGpu}</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="mtx-marquee flex min-h-10 w-full items-center border-y-2 border-border-strong bg-surface">
          <div className="w-full overflow-hidden py-2 font-mono text-xs font-semibold tracking-widest text-ink">
            <div className="mtx-marquee-track" data-paused={prefersReduced ? 'true' : 'false'}>
              <span className="shrink-0 pr-12">{VI_MESSAGES.home.tickerLine}</span>
              <span aria-hidden="true" className="shrink-0 pr-12">
                {VI_MESSAGES.home.tickerLine}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={`${WIDE_CONTAINER_CLASS} flex flex-col gap-7 pt-6 sm:gap-10 sm:pt-8`}>
        <div id="featured-cpu" className="scroll-mt-16 md:scroll-mt-24">
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
          <div className="flex flex-col gap-7 sm:gap-10">
            <section
              data-testid={TEST_IDS.home.featuredCpuSection}
              className="parallax-section-rise flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary pl-3">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-accent-ink">
                    01 // CENTRAL PROCESSORS
                  </p>
                  <h2 className="font-display text-xl font-bold text-ink uppercase sm:text-2xl">
                    {VI_MESSAGES.home.featuredCpuTitle}
                  </h2>
                  <p className="text-xs text-ink-muted sm:text-sm">{VI_MESSAGES.home.browseCpuDesc}</p>
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
              className="parallax-section-rise flex flex-col gap-3 scroll-mt-16 sm:gap-4 md:scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-primary pl-3">
                <div>
                  <p className="font-mono text-xs font-bold tracking-widest text-accent-ink">
                    02 // GRAPHICS PROCESSORS
                  </p>
                  <h2 className="font-display text-xl font-bold text-ink uppercase sm:text-2xl">
                    {VI_MESSAGES.home.featuredGpuTitle}
                  </h2>
                  <p className="text-xs text-ink-muted sm:text-sm">{VI_MESSAGES.home.browseGpuDesc}</p>
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

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:gap-5">
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

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-accent-ink">TOOL // 03</span>
                <Layers className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-ink">{VI_MESSAGES.tools.combo.title}</h3>
              <p className="text-sm text-ink-muted">{VI_MESSAGES.home.comboShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/combo" data-testid={TEST_IDS.home.toolCombo}>
                <Button variant="outline" size="sm">
                  <span>{VI_MESSAGES.nav.combo}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="font-mono text-xs font-bold text-accent-ink">TOOL // 04</span>
                <TrendingUp className="h-4 w-4 text-ink-muted" aria-hidden="true" />
              </div>
              <h3 className="font-display font-bold text-ink">{VI_MESSAGES.tools.upgrade.title}</h3>
              <p className="text-sm text-ink-muted">{VI_MESSAGES.home.upgradeShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/upgrade" data-testid={TEST_IDS.home.toolUpgrade}>
                <Button variant="outline" size="sm">
                  <span>{VI_MESSAGES.nav.upgrade}</span>
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
