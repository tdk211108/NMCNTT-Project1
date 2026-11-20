'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import { ProductImage } from '@/components/ui/ProductImage';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ProductCard as ProductCardDto } from '@/shared/types';
import type { useHomeController } from '../useHomeController';

export type HomeViewProps = ReturnType<typeof useHomeController>;

function HeroShowcaseRow({
  label,
  product,
}: {
  label: string;
  product: ProductCardDto;
}) {
  const scorePct = product.score.normalized !== null ? Math.min(100, Math.max(0, product.score.normalized)) : 0;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3.5 rounded-[16px] border border-border bg-surface-subtle/85 p-3 shadow-[inset_0_1px_0_var(--aero-specular)] transition-[transform,border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-elevated active:scale-[0.99]"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white p-1 shadow-xs ring-1 ring-white/80 dark:ring-sky-300/20">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <span className="text-xs font-semibold text-primary">{label}</span>
          <Badge variant="default">{product.vendor.toUpperCase()}</Badge>
        </div>
        <p className="mt-0.5 truncate text-sm font-bold text-ink group-hover:text-primary">
          {product.name}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          <span className="font-mono text-sm font-bold tabular-nums text-primary">
            {formatVnd(product.priceVnd)}
          </span>
          {product.score.normalized !== null ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-elevated ring-1 ring-border-strong/50">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#10b981)]"
                  style={{ width: `${scorePct}%` }}
                />
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-ink-muted">
                {formatNumberVi(product.score.normalized, 1)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function HomeView({ state, actions }: HomeViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);

  const topCpu = state.cpus[0];
  const topGpu = state.gpus[0];
  const showcaseIds = [topCpu?.id, topGpu?.id].filter(Boolean);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const video = videoRef.current;
    if (!video) return;

    if (media.matches) {
      video.pause();
    }

    const handleChange = () => {
      if (!videoRef.current) return;
      if (media.matches) {
        videoRef.current.pause();
      } else {
        void videoRef.current.play().catch(() => {});
      }
    };

    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  function handleToggleVideo() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="relative left-1/2 -mt-6 flex min-h-[calc(100dvh-7.5rem)] w-screen -translate-x-1/2 items-center overflow-hidden">
        <video
          ref={videoRef}
          src="/videoplayback.webm"
          poster="/images/neo-aero-light.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onPlay={() => setVideoPlaying(true)}
          onPause={() => setVideoPlaying(false)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,28,20,0.66)_0%,rgba(4,28,20,0.36)_48%,rgba(4,28,20,0.08)_100%)] dark:bg-[linear-gradient(90deg,rgba(3,18,14,0.78)_0%,rgba(3,18,14,0.52)_52%,rgba(3,18,14,0.22)_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent_0%,var(--aero-bg)_100%)]"
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="flex flex-col items-start text-left lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-black/25 px-3 py-1 backdrop-blur-md">
                <AeroIconBadge name="layers-bold-duotone" size="sm" />
                <span className="text-sm font-semibold text-white">{VI_MESSAGES.brand.name}</span>
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl leading-[1.15] font-bold tracking-tight text-white drop-shadow-[0_2px_14px_rgba(3,18,14,0.65)] sm:text-4xl lg:text-[2.85rem]">
                {VI_MESSAGES.home.heroTitle}
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed font-medium text-emerald-50/95 drop-shadow-[0_1px_10px_rgba(3,18,14,0.72)] sm:text-lg">
                {VI_MESSAGES.home.heroSubtitle}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                <a
                  href="#featured-cpu"
                  data-testid={TEST_IDS.home.heroScrollCta}
                  className="aero-pill-cta inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-[transform,filter] duration-150 ease-out hover:brightness-105 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="relative z-1">{VI_MESSAGES.home.heroScrollCta}</span>
                  <SolarIcon
                    name="alt-arrow-down-bold-duotone"
                    withShadow={false}
                    className="relative z-1 h-4 w-4"
                  />
                </a>
                <Link href="/cpu" data-testid={TEST_IDS.home.browseCpu}>
                  <Button variant="secondary" className="whitespace-nowrap">
                    {VI_MESSAGES.home.viewAllCpu}
                  </Button>
                </Link>
                <Link href="/gpu" data-testid={TEST_IDS.home.browseGpu}>
                  <Button variant="secondary" className="whitespace-nowrap">
                    {VI_MESSAGES.home.viewAllGpu}
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="flex flex-col gap-4 p-6 lg:col-span-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-ink">{VI_MESSAGES.home.showcaseHeading}</h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {VI_MESSAGES.home.showcaseSubheading}
                  </p>
                </div>
                <AeroIconBadge name="graph-up-bold-duotone" size="md" />
              </div>

              {state.isLoading ? (
                <div className="flex flex-col gap-3">
                  <div className="h-22 animate-pulse rounded-[16px] bg-surface-subtle" />
                  <div className="h-22 animate-pulse rounded-[16px] bg-surface-subtle" />
                </div>
              ) : topCpu || topGpu ? (
                <div className="flex flex-col gap-3">
                  {topCpu ? (
                    <HeroShowcaseRow label={VI_MESSAGES.home.showcaseCpuLabel} product={topCpu} />
                  ) : null}
                  {topGpu ? (
                    <HeroShowcaseRow label={VI_MESSAGES.home.showcaseGpuLabel} product={topGpu} />
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">{VI_MESSAGES.common.noData}</p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                <Link
                  href={showcaseIds.length > 0 ? `/compare?ids=${showcaseIds[0]}` : '/compare'}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  <SolarIcon name="scale-bold-duotone" className="h-4 w-4" withShadow={false} />
                  <span>{VI_MESSAGES.home.showcaseCompareLink}</span>
                </Link>
                <Link
                  href="/tools/psu"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary"
                >
                  <SolarIcon name="bolt-bold-duotone" className="h-4 w-4" withShadow={false} />
                  <span>{VI_MESSAGES.nav.psu}</span>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleVideo}
          aria-label={videoPlaying ? 'Tạm dừng video nền' : 'Phát video nền'}
          title={videoPlaying ? 'Tạm dừng video nền' : 'Phát video nền'}
          className="aero-glass absolute bottom-4 left-4 z-20 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-ink transition-[transform,background-color] duration-150 hover:bg-surface-elevated active:scale-95"
        >
          {videoPlaying ? (
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
              <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 translate-x-0.5">
              <path d="M4 2.75a.75.75 0 0 1 1.14-.64l8.25 5.25a.75.75 0 0 1 0 1.28l-8.25 5.25A.75.75 0 0 1 4 13.25V2.75Z" />
            </svg>
          )}
        </button>
      </section>

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
          <div className="flex flex-col gap-12">
            <section
              data-testid={TEST_IDS.home.featuredCpuSection}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AeroIconBadge name="cpu-bold-duotone" size="md" />
                  <div>
                    <h2 className="text-2xl font-bold text-ink">{VI_MESSAGES.home.featuredCpuTitle}</h2>
                    <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseCpuDesc}</p>
                  </div>
                </div>
                <Link href="/cpu" data-testid={TEST_IDS.home.featuredCpuAll}>
                  <Button variant="secondary" size="sm">
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
              className="flex scroll-mt-24 flex-col gap-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AeroIconBadge name="monitor-bold-duotone" size="md" />
                  <div>
                    <h2 className="text-2xl font-bold text-ink">{VI_MESSAGES.home.featuredGpuTitle}</h2>
                    <p className="text-sm text-ink-muted">{VI_MESSAGES.home.browseGpuDesc}</p>
                  </div>
                </div>
                <Link href="/gpu" data-testid={TEST_IDS.home.featuredGpuAll}>
                  <Button variant="secondary" size="sm">
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

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold text-ink">{VI_MESSAGES.home.toolsHeading}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <AeroIconBadge name="scale-bold-duotone" size="md" />
              <div>
                <h3 className="text-base font-bold text-ink">{VI_MESSAGES.tools.compare.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.compareShortcutDesc}</p>
              </div>
            </div>
            <div>
              <Link href="/compare" data-testid={TEST_IDS.home.toolCompare}>
                <Button variant="secondary" size="sm">
                  {VI_MESSAGES.nav.compare}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <AeroIconBadge name="graph-up-bold-duotone" size="md" />
              <div>
                <h3 className="text-base font-bold text-ink">{VI_MESSAGES.tools.perfPerPrice.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.pppShortcutDesc}</p>
              </div>
            </div>
            <div>
              <Link href="/tools/perf-per-price" data-testid={TEST_IDS.home.toolPpp}>
                <Button variant="secondary" size="sm">
                  {VI_MESSAGES.nav.perfPerPrice}
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-3">
              <AeroIconBadge name="bolt-bold-duotone" size="md" />
              <div>
                <h3 className="text-base font-bold text-ink">{VI_MESSAGES.tools.psu.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.home.psuShortcutDesc}</p>
              </div>
            </div>
            <div>
              <Link href="/tools/psu" data-testid={TEST_IDS.home.toolPsu}>
                <Button variant="secondary" size="sm">
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
