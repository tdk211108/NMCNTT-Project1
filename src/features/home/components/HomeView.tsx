'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useHomeController } from '../useHomeController';

export type HomeViewProps = ReturnType<typeof useHomeController>;

export function HomeView({ state, actions }: HomeViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroWrapperRef = useRef<HTMLDivElement>(null);
  const slowLayerRef = useRef<HTMLDivElement>(null);
  const midLayerRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);

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

      if (activeNodes.has(heroWrapper)) {
        const rect = heroWrapper.getBoundingClientRect();
        const progress =
          rect.height > 0 ? Math.min(1, Math.max(0, -rect.top / rect.height)) : 0;
        if (slowLayerRef.current) {
          slowLayerRef.current.style.transform = `translate3d(0, ${(96 * progress).toFixed(1)}px, 0)`;
        }
        if (midLayerRef.current) {
          midLayerRef.current.style.transform = `translate3d(0, ${(52 * progress).toFixed(1)}px, 0)`;
        }
        if (frontLayerRef.current) {
          frontLayerRef.current.style.transform = `translate3d(0, ${(-24 * progress).toFixed(1)}px, 0)`;
        }
      }

      const entrySpan = Math.max(1, window.innerHeight * 0.35);
      for (const node of sectionNodes) {
        if (!activeNodes.has(node)) continue;
        const rect = node.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / entrySpan));
        node.style.transform = `translate3d(0, ${((1 - progress) * 28).toFixed(1)}px, 0)`;
        node.style.opacity = (0.9 + 0.1 * progress).toFixed(3);
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

  return (
    <div ref={rootRef} className="flex flex-col gap-12">
      <section
        ref={heroWrapperRef}
        className="parallax-hero-wrapper relative flex min-h-[calc(100dvh-8.5rem)] flex-col justify-center overflow-clip py-8 sm:py-12"
      >
        <div
          ref={slowLayerRef}
          aria-hidden="true"
          className="parallax-layer-slow pointer-events-none absolute inset-0"
        >
          <div className="absolute top-1/2 right-0 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/16 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute bottom-4 left-12 h-56 w-56 rounded-full bg-success/10 blur-3xl sm:h-72 sm:w-72" />
        </div>

        <div
          ref={midLayerRef}
          aria-hidden="true"
          className="parallax-layer-mid pointer-events-none absolute inset-0"
        >
          <div className="hero-tech-grid absolute inset-0" />
          <div className="absolute top-1/2 right-6 hidden h-64 w-64 -translate-y-1/2 rounded-full border border-accent/20 lg:block" />
          <div className="absolute top-1/2 right-16 hidden h-44 w-44 -translate-y-1/2 rounded-full border border-border-strong/50 lg:block" />
        </div>

        <div
          ref={frontLayerRef}
          className="parallax-layer-front relative z-10 flex w-full max-w-2xl flex-col items-start text-left"
        >
          <h1 className="text-[clamp(2.25rem,1.4rem+3.6vw,4.75rem)] leading-[1.04] font-bold tracking-tight text-ink text-balance">
            <span className="block">{VI_MESSAGES.home.heroTitleLine1}</span>
            <span className="block">{VI_MESSAGES.home.heroTitleLine2}</span>
          </h1>

          <p className="mt-5 max-w-xl text-[clamp(1rem,0.92rem+0.45vw,1.35rem)] leading-relaxed text-ink-muted text-pretty">
            {VI_MESSAGES.home.heroSubtitle}
          </p>

          <p className="mt-4 text-xs font-semibold tracking-[0.22em] text-accent">
            {VI_MESSAGES.home.heroRetailerLabel}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#featured-cpu"
              data-testid={TEST_IDS.home.heroScrollCta}
              className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {VI_MESSAGES.home.heroScrollCta}
            </a>
            <Link href="/cpu" data-testid={TEST_IDS.home.browseCpu}>
              <Button variant="outline">{VI_MESSAGES.home.viewAllCpu}</Button>
            </Link>
            <Link href="/gpu" data-testid={TEST_IDS.home.browseGpu}>
              <Button variant="outline">{VI_MESSAGES.home.viewAllGpu}</Button>
            </Link>
          </div>
        </div>
      </section>

      <div id="featured-cpu" className="scroll-mt-6">
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
          <div className="flex flex-col gap-12">
            <section
              data-testid={TEST_IDS.home.featuredCpuSection}
              className="parallax-section-rise flex flex-col gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-ink">{VI_MESSAGES.home.featuredCpuTitle}</h2>
                  <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseCpuDesc}</p>
                </div>
                <Link href="/cpu" data-testid={TEST_IDS.home.featuredCpuAll}>
                  <Button variant="outline" size="sm">
                    {VI_MESSAGES.home.viewAllCpu}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.cpus.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
            </section>

            <section
              id="featured-gpu"
              data-testid={TEST_IDS.home.featuredGpuSection}
              className="parallax-section-rise flex flex-col gap-4 scroll-mt-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-ink">{VI_MESSAGES.home.featuredGpuTitle}</h2>
                  <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseGpuDesc}</p>
                </div>
                <Link href="/gpu" data-testid={TEST_IDS.home.featuredGpuAll}>
                  <Button variant="outline" size="sm">
                    {VI_MESSAGES.home.viewAllGpu}
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {state.gpus.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <section className="parallax-section-rise flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink">{VI_MESSAGES.home.toolsHeading}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">{VI_MESSAGES.tools.compare.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.compareShortcutDesc}</p>
            </div>
            <div>
              <Link href="/compare" data-testid={TEST_IDS.home.toolCompare}>
                <Button variant="outline" size="sm">
                  {VI_MESSAGES.nav.compare}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">{VI_MESSAGES.tools.perfPerPrice.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.pppShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/perf-per-price" data-testid={TEST_IDS.home.toolPpp}>
                <Button variant="outline" size="sm">
                  {VI_MESSAGES.nav.perfPerPrice}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div>
              <h3 className="font-semibold text-ink">{VI_MESSAGES.tools.psu.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.psuShortcutDesc}</p>
            </div>
            <div>
              <Link href="/tools/psu" data-testid={TEST_IDS.home.toolPsu}>
                <Button variant="outline" size="sm">
                  {VI_MESSAGES.nav.psu}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
