'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { CatalogPagination } from '@/components/ui/CatalogPagination';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { paginateItems, PRODUCT_SORT_OPTIONS } from '@/lib/pagination';
import { SEARCH_RESULTS_PAGE_SIZE } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { SearchTab, useSearchResultsController } from '../useSearchResultsController';

export type SearchResultsViewProps = ReturnType<typeof useSearchResultsController>;

export function SearchResultsView({ state, actions }: SearchResultsViewProps) {
  const cpuSectionRef = useRef<HTMLElement>(null);
  const gpuSectionRef = useRef<HTMLElement>(null);

  const pageSize = state.pageSize ?? SEARCH_RESULTS_PAGE_SIZE;
  const pagedCpus = paginateItems(state.cpus, state.cpuPage ?? 1, pageSize);
  const pagedGpus = paginateItems(state.gpus, state.gpuPage ?? 1, pageSize);

  const showCpuSection =
    state.cpus.length > 0 && (state.activeTab === 'all' || state.activeTab === 'cpu');
  const showGpuSection =
    state.gpus.length > 0 && (state.activeTab === 'all' || state.activeTab === 'gpu');

  const tabs: Array<{ key: SearchTab; label: string; testId: string }> = [
    { key: 'all', label: `${VI_MESSAGES.catalog.searchTabAll} (${state.total})`, testId: TEST_IDS.search.tabAll },
    { key: 'cpu', label: `${VI_MESSAGES.catalog.searchTabCpu} (${state.cpus.length})`, testId: TEST_IDS.search.tabCpu },
    { key: 'gpu', label: `${VI_MESSAGES.catalog.searchTabGpu} (${state.gpus.length})`, testId: TEST_IDS.search.tabGpu },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          {
            label: VI_MESSAGES.catalog.searchResultsTitle,
            href: state.query ? `/search?q=${encodeURIComponent(state.query)}` : '/search',
          },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.catalog.searchResultsTitle}</h1>
          {state.query ? (
            <p className="mt-1 font-mono text-xs tabular-nums text-ink-muted">
              {VI_MESSAGES.catalog.searchQueryLabel}: {state.query} ({state.total})
            </p>
          ) : null}
        </div>

        {state.validQuery ? (
          <div className="w-full sm:w-64">
            <ComboboxSelect
              label={VI_MESSAGES.catalog.sortLabel}
              value={state.sort}
              options={PRODUCT_SORT_OPTIONS}
              testId={TEST_IDS.search.sortSelect}
              onChange={(nextSort) => actions.onChangeSort(nextSort)}
            />
          </div>
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
          <div
            role="tablist"
            aria-label={VI_MESSAGES.catalog.searchResultsTitle}
            className="flex flex-wrap gap-2.5 border-b border-border pb-3"
          >
            {tabs.map((tab) => {
              const selected = state.activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  role="tab"
                  aria-selected={selected}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
                  variant={selected ? 'primary' : 'outline'}
                  data-testid={tab.testId}
                  onClick={() => actions.onChangeTab(tab.key)}
                >
                  {tab.label}
                </Button>
              );
            })}
          </div>

          {!showCpuSection && !showGpuSection ? (
            <EmptyState title={VI_MESSAGES.catalog.noProductsFound} />
          ) : null}

          {showCpuSection ? (
            <section ref={cpuSectionRef} className="flex scroll-mt-24 flex-col gap-3">
              <h2 className="font-display border-b-2 border-border-strong pb-2 text-lg font-bold text-ink">
                {VI_MESSAGES.catalog.cpuPageTitle} ({state.cpus.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedCpus.items.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
              <CatalogPagination
                scope="search-cpu"
                currentPage={pagedCpus.page}
                totalItems={state.cpus.length}
                pageSize={pageSize}
                onPageChange={(nextPage) => {
                  actions.onChangeCpuPage(nextPage);
                  cpuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            </section>
          ) : null}

          {showGpuSection ? (
            <section ref={gpuSectionRef} className="flex scroll-mt-24 flex-col gap-3">
              <h2 className="font-display border-b-2 border-border-strong pb-2 text-lg font-bold text-ink">
                {VI_MESSAGES.catalog.gpuPageTitle} ({state.gpus.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedGpus.items.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
              <CatalogPagination
                scope="search-gpu"
                currentPage={pagedGpus.page}
                totalItems={state.gpus.length}
                pageSize={pageSize}
                onPageChange={(nextPage) => {
                  actions.onChangeGpuPage(nextPage);
                  gpuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
