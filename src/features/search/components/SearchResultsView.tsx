import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { useSearchResultsController } from '../useSearchResultsController';

export type SearchResultsViewProps = ReturnType<typeof useSearchResultsController>;

export function SearchResultsView({ state, actions }: SearchResultsViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.catalog.searchResultsTitle}</h1>
        {state.query ? (
          <p className="mt-1 text-sm text-ink-muted">
            {VI_MESSAGES.catalog.searchQueryLabel}: {state.query} ({state.total})
          </p>
        ) : null}
      </div>

      {!state.validQuery ? (
        <EmptyState title={VI_MESSAGES.catalog.searchEmptyPrompt} />
      ) : state.isLoading ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : state.total === 0 ? (
        <EmptyState
          title={VI_MESSAGES.catalog.searchNoResults}
          action={
            <Link href="/cpu">
              <Button variant="secondary">{VI_MESSAGES.common.backToStore}</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          {state.cpus.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="border-b border-border pb-2 text-lg font-semibold text-ink">
                {VI_MESSAGES.catalog.cpuPageTitle} ({state.cpus.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.cpus.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {state.gpus.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="border-b border-border pb-2 text-lg font-semibold text-ink">
                {VI_MESSAGES.catalog.gpuPageTitle} ({state.gpus.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.gpus.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
