'use client';

import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PriceInput } from '@/components/ui/PriceInput';
import { isOutsideDialogBackdropClick, useNativeDialog } from '@/lib/client-hooks';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ChipVendor } from '@/shared/types';
import type { CatalogViewProps } from './CatalogView';

export function CatalogFilterPanel({ state, actions }: CatalogViewProps) {
  const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('max');
  const { priceSlider } = state;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">
          {VI_MESSAGES.catalog.filterVendorLabel}
        </p>
        <div className="flex flex-wrap gap-2.5">
          {state.facets.vendors.map((vendor) => {
            const active = state.selectedVendors.includes(vendor);
            return (
              <Button
                key={vendor}
                size="sm"
                cyber={false}
                sfx="toggle"
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
          <PriceInput
            label={VI_MESSAGES.catalog.filterPriceMinLabel}
            value={state.priceMinInput}
            data-testid={TEST_IDS.listing.filterPriceMin}
            onValueChange={actions.onChangePriceMin}
          />
          <PriceInput
            label={VI_MESSAGES.catalog.filterPriceMaxLabel}
            value={state.priceMaxInput}
            data-testid={TEST_IDS.listing.filterPriceMax}
            onValueChange={actions.onChangePriceMax}
          />
        </div>

        <div className="flex flex-col gap-2 border-2 border-border bg-surface-subtle p-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-ink">
              {VI_MESSAGES.catalog.filterPriceSliderLabel}
            </span>
          </div>

          <div className="relative flex h-7 w-full items-center">
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
          <div className="flex flex-wrap gap-2.5">
            {state.facets.sockets.map((socket) => {
              const active = state.selectedSockets.includes(socket);
              return (
                <Button
                  key={socket}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
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
          <div className="flex flex-wrap gap-2.5">
            {state.facets.vramGb.map((gb) => {
              const active = state.selectedVramGb.includes(gb);
              return (
                <Button
                  key={gb}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
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
          <div className="flex flex-wrap gap-2.5">
            {state.facets.aibBrands.map((brand) => {
              const active = state.selectedAibBrands.includes(brand);
              return (
                <Button
                  key={brand}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
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
    </div>
  );
}

export function MobileFilterDrawer({
  open,
  onClose,
  state,
  actions,
}: CatalogViewProps & { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useNativeDialog(dialogRef, open);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={VI_MESSAGES.catalog.mobileFilterTitle}
      data-testid={TEST_IDS.listing.mobileFilterDrawer}
      onClose={onClose}
      onClick={(event) => {
        if (isOutsideDialogBackdropClick(event, dialogRef.current)) {
          onClose();
        }
      }}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="mtx-shadow-accent m-auto mt-auto mb-0 flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-card border-2 border-b-0 border-border-strong bg-surface p-0 text-ink"
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-border-strong bg-surface-subtle px-4 py-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-accent-ink" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-ink uppercase">
            {VI_MESSAGES.catalog.mobileFilterTitle}
          </h2>
        </div>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label={VI_MESSAGES.catalog.mobileFilterCloseAria}
          className="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        <CatalogFilterPanel state={state} actions={actions} />
      </div>

      <div className="flex items-center gap-3 border-t-2 border-border-strong bg-surface-subtle px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          data-testid={TEST_IDS.listing.mobileFilterApply}
          onClick={onClose}
        >
          {VI_MESSAGES.catalog.mobileFilterApply(state.total)}
        </Button>
      </div>
    </dialog>
  );
}
