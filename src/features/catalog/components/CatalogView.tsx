'use client';

import { RotateCcw } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CatalogPagination } from '@/components/ui/CatalogPagination';
import { ComboboxSelect, type ComboboxSelectOption } from '@/components/ui/ComboboxSelect';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { formatVnd } from '@/lib/format';
import { CPU_PER_BRAND_PAGE_SIZE, GPU_PAGE_SIZE } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ChipVendor, ProductSort } from '@/shared/types';
import {
  groupProductsByVendor,
  paginateItems,
  type useCatalogController,
} from '../useCatalogController';
import { ProductCard } from './ProductCard';

export type CatalogViewProps = ReturnType<typeof useCatalogController>;

const SORT_OPTIONS: readonly ComboboxSelectOption<ProductSort>[] = [
  { value: 'default', label: VI_MESSAGES.catalog.sortDefault },
  { value: 'price_asc', label: VI_MESSAGES.catalog.sortPriceAsc },
  { value: 'price_desc', label: VI_MESSAGES.catalog.sortPriceDesc },
  { value: 'score_desc', label: VI_MESSAGES.catalog.sortScoreDesc },
];

export function CatalogView({ state, actions }: CatalogViewProps) {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('max');
  const resultsRef = useRef<HTMLElement>(null);

  const title =
    state.category === 'cpu' ? VI_MESSAGES.catalog.cpuPageTitle : VI_MESSAGES.catalog.gpuPageTitle;

  const { priceSlider } = state;
  const pageSize =
    state.pageSize ?? (state.category === 'cpu' ? CPU_PER_BRAND_PAGE_SIZE : GPU_PAGE_SIZE);
  const pageByVendor = state.pageByVendor ?? {};
  const flatPage = state.flatPage ?? 1;

  function scrollResultsIntoView() {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
          <p className="font-mono text-xs tabular-nums text-ink-muted">
            {VI_MESSAGES.catalog.productCountLabel(state.total)}
          </p>
        </div>

        <div className="w-full sm:w-64">
          <ComboboxSelect
            label={VI_MESSAGES.catalog.sortLabel}
            value={state.sort}
            options={SORT_OPTIONS}
            testId={TEST_IDS.listing.sortSelect}
            onChange={(nextSort) => actions.onChangeSort(nextSort)}
          />
        </div>
      </div>

      {state.category === 'gpu' ? (
        <div
          role="tablist"
          aria-label={VI_MESSAGES.catalog.gpuPageTitle}
          className="flex flex-wrap gap-2 border-b border-border pb-3"
        >
          <Button
            role="tab"
            aria-selected={!state.limitedOnly}
            size="sm"
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
            variant={state.limitedOnly ? 'primary' : 'outline'}
            data-testid={TEST_IDS.listing.gpuTabLimited}
            onClick={() => actions.onChangeLimitedOnly(true)}
          >
            {VI_MESSAGES.catalog.gpuTabLimited}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[272px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          aria-label="Bộ lọc sản phẩm"
          className="mtx-sticky-aside min-w-0 overscroll-contain lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100dvh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pr-1 lg:pb-2"
        >
          <Card className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">
                {VI_MESSAGES.catalog.filterVendorLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {state.facets.vendors.map((vendor) => {
                  const active = state.selectedVendors.includes(vendor);
                  return (
                    <Button
                      key={vendor}
                      size="sm"
                      variant={active ? 'primary' : 'outline'}
                      data-testid={TEST_IDS.listing.filterVendor(vendor)}
                      onClick={() => actions.onToggleVendor(vendor as ChipVendor)}
                    >
                      {vendor.toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  label={VI_MESSAGES.catalog.filterPriceMinLabel}
                  value={state.priceMinInput}
                  data-testid={TEST_IDS.listing.filterPriceMin}
                  onChange={(e) => actions.onChangePriceMin(e.target.value)}
                />
                <Input
                  type="text"
                  inputMode="numeric"
                  label={VI_MESSAGES.catalog.filterPriceMaxLabel}
                  value={state.priceMaxInput}
                  data-testid={TEST_IDS.listing.filterPriceMax}
                  onChange={(e) => actions.onChangePriceMax(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2 border-2 border-border bg-surface-subtle p-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-ink">
                    {VI_MESSAGES.catalog.filterPriceSliderLabel}
                  </span>
                </div>

                <div className="relative flex h-6 w-full items-center">
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-full border border-border-strong bg-surface"
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      left: `${priceSlider.minPct}%`,
                      width: `${Math.max(0, priceSlider.maxPct - priceSlider.minPct)}%`,
                    }}
                    className="pointer-events-none absolute h-1.5 bg-primary"
                  />

                  <input
                    type="range"
                    min={priceSlider.min}
                    max={priceSlider.max}
                    step={priceSlider.step}
                    value={priceSlider.minValue}
                    aria-label={VI_MESSAGES.catalog.filterPriceSliderMinAria}
                    aria-valuetext={formatVnd(priceSlider.minValue)}
                    data-testid={TEST_IDS.listing.filterPriceSliderMin}
                    onPointerDown={() => setActiveThumb('min')}
                    onFocus={() => setActiveThumb('min')}
                    onChange={(e) => actions.onSlidePriceMin(Number(e.target.value))}
                    className={`mtx-range-input ${activeThumb === 'min' ? 'z-20' : 'z-10'}`}
                  />
                  <input
                    type="range"
                    min={priceSlider.min}
                    max={priceSlider.max}
                    step={priceSlider.step}
                    value={priceSlider.maxValue}
                    aria-label={VI_MESSAGES.catalog.filterPriceSliderMaxAria}
                    aria-valuetext={formatVnd(priceSlider.maxValue)}
                    data-testid={TEST_IDS.listing.filterPriceSliderMax}
                    onPointerDown={() => setActiveThumb('max')}
                    onFocus={() => setActiveThumb('max')}
                    onChange={(e) => actions.onSlidePriceMax(Number(e.target.value))}
                    className={`mtx-range-input ${activeThumb === 'max' ? 'z-20' : 'z-10'}`}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums text-ink-muted">
                  <span>{formatVnd(priceSlider.minValue)}</span>
                  <span>{formatVnd(priceSlider.maxValue)}</span>
                </div>
              </div>
            </div>

            {state.category === 'cpu' && state.facets.sockets?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {VI_MESSAGES.catalog.filterSocketLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.facets.sockets.map((socket) => {
                    const active = state.selectedSockets.includes(socket);
                    return (
                      <Button
                        key={socket}
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        data-testid={TEST_IDS.listing.filterSocket(socket)}
                        onClick={() => actions.onToggleSocket(socket)}
                      >
                        {socket}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {state.category === 'gpu' && state.facets.vramGb?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {VI_MESSAGES.catalog.filterVramLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.facets.vramGb.map((gb) => {
                    const active = state.selectedVramGb.includes(gb);
                    return (
                      <Button
                        key={gb}
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        data-testid={TEST_IDS.listing.filterVram(gb)}
                        onClick={() => actions.onToggleVram(gb)}
                      >
                        {gb} GB
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {state.category === 'gpu' && state.facets.aibBrands?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">
                  {VI_MESSAGES.catalog.filterAibLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {state.facets.aibBrands.map((brand) => {
                    const active = state.selectedAibBrands.includes(brand);
                    return (
                      <Button
                        key={brand}
                        size="sm"
                        variant={active ? 'primary' : 'outline'}
                        data-testid={TEST_IDS.listing.filterAib(brand)}
                        onClick={() => actions.onToggleAibBrand(brand)}
                      >
                        {brand}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <Button
              variant="ghost"
              size="sm"
              data-testid={TEST_IDS.listing.filterClear}
              onClick={actions.onClearFilters}
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.catalog.clearFilters}</span>
            </Button>
          </Card>
        </aside>

        <section ref={resultsRef} className="min-w-0 scroll-mt-24">
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
                const pagedGroup = paginateItems(
                  group.items,
                  pageByVendor[group.vendor] ?? 1,
                  pageSize,
                );
                return (
                  <section key={group.vendor} className="flex flex-col gap-3">
                    <h2 className="font-display border-b-2 border-border-strong pb-2 text-lg font-bold text-ink">
                      {group.vendor.toUpperCase()} ({group.items.length})
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {pagedGroup.items.map((product) => (
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
                      currentPage={pagedGroup.page}
                      totalItems={group.items.length}
                      pageSize={pageSize}
                      onPageChange={(nextPage) => actions.onChangeVendorPage?.(group.vendor, nextPage)}
                    />
                  </section>
                );
              })}
            </div>
          ) : state.category === 'gpu' && state.groupedByVendor ? (
            (() => {
              const pagedGpu = paginateItems(state.items, flatPage, pageSize);
              const groupedPage = groupProductsByVendor(pagedGpu.items);
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
                    currentPage={pagedGpu.page}
                    totalItems={state.items.length}
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
            (() => {
              const pagedFlat = paginateItems(state.items, flatPage, pageSize);
              return (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {pagedFlat.items.map((product) => (
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
                    currentPage={pagedFlat.page}
                    totalItems={state.items.length}
                    pageSize={pageSize}
                    onPageChange={(nextPage) => {
                      actions.onChangeFlatPage?.(nextPage);
                      scrollResultsIntoView();
                    }}
                  />
                </div>
              );
            })()
          )}
        </section>
      </div>
    </div>
  );
}
