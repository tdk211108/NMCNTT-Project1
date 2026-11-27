'use client';

import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CatalogPagination } from '@/components/ui/CatalogPagination';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { formatVnd, parsePriceInputDigits } from '@/lib/format';
import { PRODUCT_SORT_OPTIONS } from '@/lib/pagination';
import { useIsBelowLgViewport } from '@/lib/use-media-query';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ChipVendor } from '@/shared/types';
import {
  groupProductsByVendor,
  type useCatalogController,
} from '../useCatalogController';
import { CatalogFilterPanel, MobileFilterDrawer } from './MobileFilterDrawer';
import { ProductCard } from './ProductCard';

export type CatalogViewProps = ReturnType<typeof useCatalogController>;

export function CatalogView({ state, actions }: CatalogViewProps) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const isCompactCatalog = useIsBelowLgViewport();
  const resultsRef = useRef<HTMLElement>(null);
  const vendorSectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const title =
    state.category === 'cpu' ? VI_MESSAGES.catalog.cpuPageTitle : VI_MESSAGES.catalog.gpuPageTitle;

  const { pageSize, pageByVendor, flatPage } = state;

  const activeFilterCount =
    state.selectedVendors.length +
    state.selectedSockets.length +
    state.selectedVramGb.length +
    state.selectedAibBrands.length +
    (state.priceMinInput.trim() ? 1 : 0) +
    (state.priceMaxInput.trim() ? 1 : 0) +
    (state.activeSeriesId ? 1 : 0);

  function scrollResultsIntoView(target?: HTMLElement | null) {
    const el = target ?? resultsRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: title, href: `/${state.category}` },
        ]}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h1>
          <p className="font-mono text-xs tabular-nums text-ink-muted">
            {VI_MESSAGES.catalog.productCountLabel(state.total)}
          </p>
        </div>

        {!isCompactCatalog ? (
          <div className="w-full sm:w-64">
            <ComboboxSelect
              label={VI_MESSAGES.catalog.sortLabel}
              value={state.sort}
              options={PRODUCT_SORT_OPTIONS}
              testId={TEST_IDS.listing.sortSelect}
              onChange={(nextSort) => actions.onChangeSort(nextSort)}
            />
          </div>
        ) : null}
      </div>

      {state.category === 'gpu' ? (
        <div
          role="tablist"
          aria-label={VI_MESSAGES.catalog.gpuPageTitle}
          className="mtx-no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border pb-3"
        >
          <Button
            role="tab"
            aria-selected={!state.limitedOnly}
            size="sm"
            cyber={false}
            sfx="toggle"
            className="shrink-0"
            variant={!state.limitedOnly ? 'primary' : 'outline'}
            data-testid={TEST_IDS.listing.gpuTabAll}
            onClick={() => actions.onChangeLimitedOnly(false)}
          >
            {VI_MESSAGES.catalog.gpuTabAll}
          </Button>
          <Button
            role="tab"
            aria-selected={state.limitedOnly}
            size="sm"
            cyber={false}
            sfx="toggle"
            className="shrink-0"
            variant={state.limitedOnly ? 'primary' : 'outline'}
            data-testid={TEST_IDS.listing.gpuTabLimited}
            onClick={() => actions.onChangeLimitedOnly(true)}
          >
            {VI_MESSAGES.catalog.gpuTabLimited}
          </Button>
          {state.activeSeriesId ? (
            <Button
              size="sm"
              cyber={false}
              className="shrink-0"
              variant="secondary"
              onClick={actions.onClearFilters}
            >
              <span>{VI_MESSAGES.catalog.seriesFilterBadge(state.activeSeriesId)}</span>
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : null}

      {isCompactCatalog ? (
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-2.5">
            <Button
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
              size="md"
              cyber={false}
              sfx="toggle"
              className="min-h-11 shrink-0"
              data-testid={TEST_IDS.listing.mobileFilterTrigger}
              onClick={() => setFilterDrawerOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {activeFilterCount > 0
                  ? VI_MESSAGES.catalog.mobileFilterCount(activeFilterCount)
                  : VI_MESSAGES.catalog.mobileFilterOpen}
              </span>
            </Button>

            <div className="min-w-0">
              <ComboboxSelect
                label={VI_MESSAGES.catalog.sortLabel}
                value={state.sort}
                options={PRODUCT_SORT_OPTIONS}
                testId={TEST_IDS.listing.sortSelect}
                onChange={(nextSort) => actions.onChangeSort(nextSort)}
              />
            </div>
          </div>

          {activeFilterCount > 0 ? (
            <div className="mtx-no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              {state.selectedVendors.map((vendor) => (
                <button
                  key={`chip-vendor-${vendor}`}
                  type="button"
                  onClick={() => actions.onToggleVendor(vendor as ChipVendor)}
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-signal bg-surface-subtle px-2.5 font-mono text-xs font-semibold text-ink"
                >
                  <span>{vendor.toUpperCase()}</span>
                  <X className="h-3 w-3 text-accent-ink" aria-hidden="true" />
                </button>
              ))}
              {state.selectedSockets.map((socket) => (
                <button
                  key={`chip-socket-${socket}`}
                  type="button"
                  onClick={() => actions.onToggleSocket(socket)}
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-signal bg-surface-subtle px-2.5 font-mono text-xs font-semibold text-ink"
                >
                  <span>{socket}</span>
                  <X className="h-3 w-3 text-accent-ink" aria-hidden="true" />
                </button>
              ))}
              {state.selectedVramGb.map((gb) => (
                <button
                  key={`chip-vram-${gb}`}
                  type="button"
                  onClick={() => actions.onToggleVram(gb)}
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-signal bg-surface-subtle px-2.5 font-mono text-xs font-semibold text-ink"
                >
                  <span>{gb} GB</span>
                  <X className="h-3 w-3 text-accent-ink" aria-hidden="true" />
                </button>
              ))}
              {state.selectedAibBrands.map((brand) => (
                <button
                  key={`chip-aib-${brand}`}
                  type="button"
                  onClick={() => actions.onToggleAibBrand(brand)}
                  className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-control border border-signal bg-surface-subtle px-2.5 font-mono text-xs font-semibold text-ink"
                >
                  <span>{brand}</span>
                  <X className="h-3 w-3 text-accent-ink" aria-hidden="true" />
                </button>
              ))}
              {(parsePriceInputDigits(state.priceMinInput) !== null ||
                parsePriceInputDigits(state.priceMaxInput) !== null) ? (
                <span className="inline-flex min-h-9 shrink-0 items-center rounded-control border border-border-strong bg-surface-subtle px-2.5 font-mono text-xs text-ink">
                  {(() => {
                    const minVal = parsePriceInputDigits(state.priceMinInput);
                    return minVal !== null ? formatVnd(minVal) : '0 đ';
                  })()}{' '}
                  /{' '}
                  {(() => {
                    const maxVal = parsePriceInputDigits(state.priceMaxInput);
                    return maxVal !== null ? formatVnd(maxVal) : 'Max';
                  })()}
                </span>
              ) : null}
              <button
                type="button"
                onClick={actions.onClearFilters}
                className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1 rounded-control border border-border-strong bg-surface px-2.5 text-xs font-semibold text-accent-ink"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{VI_MESSAGES.catalog.clearFilters}</span>
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        {!isCompactCatalog ? (
          <aside
            aria-label={VI_MESSAGES.catalog.filterSidebarAria}
            className="mtx-sticky-aside min-w-0 overscroll-contain lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100dvh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:pb-2"
          >
            <Card>
              <CatalogFilterPanel state={state} actions={actions} />
            </Card>
          </aside>
        ) : (
          <MobileFilterDrawer
            open={filterDrawerOpen}
            onClose={() => setFilterDrawerOpen(false)}
            state={state}
            actions={actions}
          />
        )}

        <section
          ref={resultsRef}
          className={`min-w-0 scroll-mt-24 transition-opacity ${state.isFetching && !state.isLoading ? 'opacity-65' : ''}`}
        >
          {state.isLoading ? (
            <Spinner />
          ) : state.errorMessage ? (
            <EmptyState title={state.errorMessage} />
          ) : state.items.length === 0 ? (
            <EmptyState
              title={VI_MESSAGES.catalog.noProductsFound}
              action={
                <Button variant="secondary" onClick={actions.onClearFilters}>
                  {VI_MESSAGES.catalog.clearFilters}
                </Button>
              }
            />
          ) : state.category === 'cpu' && state.groupedByVendor ? (
            <div className="flex flex-col gap-8">
              {state.groupedByVendor.map((group) => {
                const groupTotal = state.vendorTotals[group.vendor] ?? group.items.length;
                const currentPage = pageByVendor[group.vendor] ?? 1;
                return (
                  <section
                    key={group.vendor}
                    ref={(el) => {
                      vendorSectionRefs.current[group.vendor] = el;
                    }}
                    className="flex scroll-mt-24 flex-col gap-3"
                  >
                    <h2 className="font-display border-b-2 border-border-strong pb-2 text-lg font-bold text-ink">
                      {group.vendor.toUpperCase()} ({groupTotal})
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {group.items.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          variant="catalog"
                          onBuyNow={actions.onBuyNow}
                          onAddToCart={actions.onAddToCart}
                          onCompare={actions.onCompare}
                        />
                      ))}
                    </div>
                    <CatalogPagination
                      scope={group.vendor}
                      currentPage={currentPage}
                      totalItems={groupTotal}
                      pageSize={pageSize}
                      onPageChange={(nextPage) => {
                        actions.onChangeVendorPage?.(group.vendor, nextPage);
                        scrollResultsIntoView(vendorSectionRefs.current[group.vendor]);
                      }}
                    />
                  </section>
                );
              })}
            </div>
          ) : state.category === 'gpu' && state.groupedByVendor ? (
            (() => {
              const groupedPage = groupProductsByVendor(state.items, state.category);
              return (
                <div className="flex flex-col gap-8">
                  {groupedPage.map((group) => (
                    <section key={group.vendor} className="flex flex-col gap-3">
                      <h2 className="font-display border-b-2 border-border-strong pb-2 text-lg font-bold text-ink">
                        {group.vendor.toUpperCase()} ({group.items.length})
                      </h2>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {group.items.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            variant="catalog"
                            onBuyNow={actions.onBuyNow}
                            onAddToCart={actions.onAddToCart}
                            onCompare={actions.onCompare}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  <CatalogPagination
                    scope="gpu"
                    currentPage={flatPage}
                    totalItems={state.total}
                    pageSize={pageSize}
                    onPageChange={(nextPage) => {
                      actions.onChangeFlatPage?.(nextPage);
                      scrollResultsIntoView();
                    }}
                  />
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {state.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="catalog"
                    onBuyNow={actions.onBuyNow}
                    onAddToCart={actions.onAddToCart}
                    onCompare={actions.onCompare}
                  />
                ))}
              </div>
              <CatalogPagination
                scope={state.category}
                currentPage={flatPage}
                totalItems={state.total}
                pageSize={pageSize}
                onPageChange={(nextPage) => {
                  actions.onChangeFlatPage?.(nextPage);
                  scrollResultsIntoView();
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
