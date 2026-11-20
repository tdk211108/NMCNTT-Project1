import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ChipVendor, ProductSort } from '@/shared/types';
import type { useCatalogController } from '../useCatalogController';
import { ProductCard } from './ProductCard';

export type CatalogViewProps = ReturnType<typeof useCatalogController>;

export function CatalogView({ state, actions }: CatalogViewProps) {
  const title =
    state.category === 'cpu' ? VI_MESSAGES.catalog.cpuPageTitle : VI_MESSAGES.catalog.gpuPageTitle;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <AeroIconBadge
            name={state.category === 'cpu' ? 'cpu-bold-duotone' : 'monitor-bold-duotone'}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="font-mono text-sm tabular-nums text-ink-muted">
              {VI_MESSAGES.catalog.productCountLabel(state.total)}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <Select
            label={VI_MESSAGES.catalog.sortLabel}
            value={state.sort}
            data-testid={TEST_IDS.listing.sortSelect}
            onChange={(e) => actions.onChangeSort(e.target.value as ProductSort)}
          >
            <option value="default">{VI_MESSAGES.catalog.sortDefault}</option>
            <option value="price_asc">{VI_MESSAGES.catalog.sortPriceAsc}</option>
            <option value="price_desc">{VI_MESSAGES.catalog.sortPriceDesc}</option>
            <option value="score_desc">{VI_MESSAGES.catalog.sortScoreDesc}</option>
          </Select>
        </div>
      </div>

      {state.category === 'gpu' ? (
        <div
          role="tablist"
          aria-label={VI_MESSAGES.catalog.gpuPageTitle}
          className="flex flex-wrap gap-2 border-b border-border/70 pb-3"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside aria-label="Bộ lọc sản phẩm" className="lg:col-span-1">
          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 text-sm font-bold text-ink">
              <SolarIcon name="tuning-2-bold-duotone" className="h-4 w-4 text-primary" />
              <span>Bộ lọc</span>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{VI_MESSAGES.catalog.filterVendorLabel}</p>
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

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Input
                type="text"
                inputMode="numeric"
                label={VI_MESSAGES.catalog.filterPriceMinLabel}
                value={state.priceMinInput}
                data-testid={TEST_IDS.listing.filterPriceMin}
                onChange={(e) => actions.onChangePriceMin(e.target.value)}
                className="font-mono tabular-nums"
              />
              <Input
                type="text"
                inputMode="numeric"
                label={VI_MESSAGES.catalog.filterPriceMaxLabel}
                value={state.priceMaxInput}
                data-testid={TEST_IDS.listing.filterPriceMax}
                onChange={(e) => actions.onChangePriceMax(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>

            {state.category === 'cpu' && state.facets.sockets?.length ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-ink">{VI_MESSAGES.catalog.filterSocketLabel}</p>
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
                <p className="mb-2 text-sm font-semibold text-ink">{VI_MESSAGES.catalog.filterVramLabel}</p>
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
                <p className="mb-2 text-sm font-semibold text-ink">{VI_MESSAGES.catalog.filterAibLabel}</p>
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
              <SolarIcon name="restart-bold-duotone" className="h-4 w-4" withShadow={false} />
              <span>{VI_MESSAGES.catalog.clearFilters}</span>
            </Button>
          </Card>
        </aside>

        <section className="lg:col-span-3">
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
          ) : state.groupedByVendor ? (
            <div className="flex flex-col gap-8">
              {state.groupedByVendor.map((group) => (
                <section key={group.vendor} className="flex flex-col gap-3">
                  <h2 className="border-b border-border/70 pb-2 text-lg font-bold text-ink">
                    {group.vendor.toUpperCase()} ({group.items.length})
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((product) => (
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
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {state.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuyNow={actions.onBuyNow}
                  onAddToCart={actions.onAddToCart}
                  onCompare={actions.onCompare}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
