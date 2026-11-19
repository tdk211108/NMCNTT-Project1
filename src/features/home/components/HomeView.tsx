import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useHomeController } from '../useHomeController';

export type HomeViewProps = ReturnType<typeof useHomeController>;

export function HomeView({ state, actions }: HomeViewProps) {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex min-h-[calc(100dvh-8.5rem)] flex-col justify-center">
        <div className="rounded-card border border-border-strong bg-surface p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-wider text-accent uppercase">
            {VI_MESSAGES.brand.name}
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl">
            {VI_MESSAGES.home.heroTitle}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {VI_MESSAGES.home.heroSubtitle}
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
              className="flex flex-col gap-4"
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
              className="flex flex-col gap-4 scroll-mt-6"
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

      <section className="flex flex-col gap-4">
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
