import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CatalogPagination, buildPaginationTokens } from '@/components/ui/CatalogPagination';
import { CatalogView } from '@/features/catalog/components/CatalogView';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import {
  CATALOG_PRICE_SLIDER_MAX,
  CATALOG_PRICE_SLIDER_MIN,
  CATALOG_PRICE_SLIDER_STEP,
  clampPriceSliderBounds,
  groupProductsByVendor,
  resolvePriceSliderRange,
} from '@/features/catalog/useCatalogController';
import { HomeView } from '@/features/home/components/HomeView';
import { ProductDetailView } from '@/features/product-detail/components/ProductDetailView';
import { SearchResultsView } from '@/features/search/components/SearchResultsView';
import { paginateItems } from '@/lib/pagination';
import type { ProductCard as ProductCardDto, ProductDetail } from '@/shared/types';

const SAMPLE_CARD: ProductCardDto = {
  id: 'cpu-amd-ryzen-7-9800x3d',
  category: 'cpu',
  name: 'AMD Ryzen 7 9800X3D',
  vendor: 'amd',
  aibBrand: null,
  isLimitedEdition: false,
  priceVnd: 13_490_000,
  imageUrl: '/icons/placeholder-product.svg',
  score: { raw: 40000, normalized: 95.2 },
  summary: [{ key: 'cores', label: 'Nhân / Luồng', value: '8 / 16' }],
};

const SECOND_CARD: ProductCardDto = {
  ...SAMPLE_CARD,
  id: 'cpu-intel-core-i9-14900k',
  name: 'Intel Core i9-14900K',
  vendor: 'intel',
  priceVnd: 14_990_000,
};

function makeCatalogActions() {
  return {
    onToggleVendor: vi.fn(),
    onChangePriceMin: vi.fn(),
    onChangePriceMax: vi.fn(),
    onSlidePriceMin: vi.fn(),
    onSlidePriceMax: vi.fn(),
    onToggleVram: vi.fn(),
    onToggleAibBrand: vi.fn(),
    onToggleSocket: vi.fn(),
    onChangeLimitedOnly: vi.fn(),
    onChangeSort: vi.fn(),
    onChangeVendorPage: vi.fn(),
    onChangeFlatPage: vi.fn(),
    onClearFilters: vi.fn(),
    onBuyNow: vi.fn(),
    onAddToCart: vi.fn(),
    onCompare: vi.fn(),
  };
}

describe('Catalog, Search, ProductCard, ProductDetail, and Home views', () => {
  it('clamps catalog dual-range price slider bounds safely and renders sticky filter rail', () => {
    expect(CATALOG_PRICE_SLIDER_MIN).toBe(0);
    expect(clampPriceSliderBounds('', '')).toEqual({
      minValue: 0,
      maxValue: CATALOG_PRICE_SLIDER_MAX,
      minPct: 0,
      maxPct: 100,
    });

    const subTwoMillion = clampPriceSliderBounds('2749000', '50000000');
    expect(subTwoMillion.minValue).toBe(2_749_000);
    expect(subTwoMillion.maxValue).toBe(50_000_000);

    const oddRange = resolvePriceSliderRange(350_500_000);
    expect(oddRange).toEqual({ min: 0, max: 350_500_000, step: 500_000 });
    expect(clampPriceSliderBounds('', '', oddRange.max, oddRange.step)).toEqual({
      minValue: 0,
      maxValue: 350_500_000,
      minPct: 0,
      maxPct: 100,
    });

    const crossed = clampPriceSliderBounds('100000000', '80000000');
    expect(crossed.maxValue).toBe(80_000_000);
    expect(crossed.minValue).toBe(80_000_000 - CATALOG_PRICE_SLIDER_STEP);

    const catalogHtml = renderToStaticMarkup(
      createElement(CatalogView, {
        state: {
          category: 'gpu',
          items: [SAMPLE_CARD],
          groupedByVendor: [{ vendor: 'amd', items: [SAMPLE_CARD] }],
          total: 1,
          vendorTotals: { amd: 1 },
          pageSize: 40,
          pageByVendor: {},
          flatPage: 1,
          facets: {
            vendors: ['amd'],
            vramGb: [16],
            aibBrands: ['Sapphire'],
            priceRange: null,
            shopMaxPriceVnd: 299_000_000,
          },
          selectedVendors: [],
          priceMinInput: '',
          priceMaxInput: '',
          priceSlider: {
            ...resolvePriceSliderRange(299_000_000),
            ...clampPriceSliderBounds('', '', 299_000_000, CATALOG_PRICE_SLIDER_STEP),
          },
          selectedVramGb: [],
          selectedAibBrands: [],
          selectedSockets: [],
          activeSeriesId: null,
          limitedOnly: false,
          sort: 'default',
          isLoading: false,
          isFetching: false,
          errorMessage: null,
        },
        actions: makeCatalogActions(),
      }),
    );

    expect(catalogHtml).toContain('lg:sticky');
    expect(catalogHtml).toContain('lg:top-[4.75rem]');
    expect(catalogHtml).toContain('2xl:grid-cols-4');
    expect(catalogHtml).not.toContain('max-h-48');
    expect(catalogHtml).toContain('data-testid="filter-price-slider-min"');
    expect(catalogHtml).toContain('data-testid="filter-price-slider-max"');
    expect(catalogHtml).toContain('min="0"');
    expect(catalogHtml).toContain('max="299000000"');
  });

  it('renders ProductCard variants, ProductDetailView zoom frame, and HomeView Hero stage', () => {
    const cardHtml = renderToStaticMarkup(
      createElement(ProductCard, {
        product: SAMPLE_CARD,
        onBuyNow: vi.fn(),
        onAddToCart: vi.fn(),
        onCompare: vi.fn(),
      }),
    );
    expect(cardHtml).toContain('product-card-zoom-img');
    expect(cardHtml).toContain('aspect-[4/3]');
    expect(cardHtml).toContain('max-h-48');
    expect(cardHtml).toContain('bg-[#ED1C24]');
    expect(cardHtml).not.toContain('/ 100');
    expect(cardHtml).toContain(`href="/products/${SAMPLE_CARD.id}"`);
    expect(cardHtml).not.toContain('image-lightbox-trigger');

    const catalogCardHtml = renderToStaticMarkup(
      createElement(ProductCard, {
        product: SAMPLE_CARD,
        variant: 'catalog',
        onBuyNow: vi.fn(),
        onAddToCart: vi.fn(),
        onCompare: vi.fn(),
      }),
    );
    expect(catalogCardHtml).toContain('aspect-[4/3]');
    expect(catalogCardHtml).toContain('p-4');
    expect(catalogCardHtml).toContain('text-lg');
    expect(catalogCardHtml).not.toContain('max-h-48');

    const gpuNvidiaCardHtml = renderToStaticMarkup(
      createElement(ProductCard, {
        product: {
          ...SAMPLE_CARD,
          id: 'gpu-sapphire-rx-9070-xt',
          category: 'gpu',
          vendor: 'nvidia',
          aibBrand: 'Sapphire',
        },
        onBuyNow: vi.fn(),
        onAddToCart: vi.fn(),
        onCompare: vi.fn(),
      }),
    );
    expect(gpuNvidiaCardHtml).toContain('bg-[#76B900]');
    expect(gpuNvidiaCardHtml).toContain('border-border-strong');
    expect(gpuNvidiaCardHtml).not.toContain('bg-accent');

    const intelCardHtml = renderToStaticMarkup(
      createElement(ProductCard, {
        product: SECOND_CARD,
        onBuyNow: vi.fn(),
        onAddToCart: vi.fn(),
        onCompare: vi.fn(),
      }),
    );
    expect(intelCardHtml).toContain('bg-[#0068B5]');

    const detail: ProductDetail = {
      ...SAMPLE_CARD,
      series: null,
      stockStatus: 'in_stock',
      warrantyMonths: 36,
      packaging: 'full_box',
      score: { raw: 40000, source: 'passmark_cpu', normalized: 95.2 },
      specGroups: [],
      psuPrefill: { cpu: SAMPLE_CARD.id },
    };
    const detailHtml = renderToStaticMarkup(
      createElement(ProductDetailView, {
        state: { isLoading: false, errorMessage: null, detail },
        actions: {
          onBuyNow: vi.fn(),
          onAddToCart: vi.fn(),
          onCompare: vi.fn(),
          onCalculatePsu: vi.fn(),
        },
      }),
    );
    expect(detailHtml).toContain('zoom-frame-cursor');
    expect(detailHtml).toContain('data-testid="detail-image-lightbox-trigger"');
    expect(detailHtml).toContain('role="button"');
    expect(detailHtml).toContain('data-testid="product-upgrade-advisor-link"');
    expect(detailHtml).toContain(
      `href="/tools/upgrade?category=cpu&amp;current=${encodeURIComponent(`store:${SAMPLE_CARD.id}`)}"`,
    );

    const homeHtml = renderToStaticMarkup(
      createElement(HomeView, {
        state: {
          cpus: [SAMPLE_CARD],
          gpus: [],
          isLoading: false,
          errorMessage: null,
        },
        actions: {
          onRetry: vi.fn(),
        },
      }),
    );
    expect(homeHtml).toContain('data-testid="home-tool-combo"');
    expect(homeHtml).toContain('data-testid="home-tool-upgrade"');
    expect(homeHtml).toContain('TOOL // 04');
    expect(homeHtml).not.toContain('TOOL // 05');
    expect(homeHtml).not.toContain('data-testid="home-tool-ppp"');
    expect(homeHtml).not.toContain('href="/tools/perf-per-price"');
    expect(homeHtml).toContain('bi-cpu');
    expect(homeHtml).toContain('bi-gpu-card');
    expect(homeHtml).toContain('Raw Compute.');
    expect(homeHtml).toContain('hero-dark-stage');
    expect(homeHtml).toContain('hero-video-mask');
    expect(homeHtml).toContain('hero-video-fade');
    expect(homeHtml).toContain('inset-0 z-0 h-full w-full');
    expect(homeHtml).not.toContain('md:w-[82%]');
    expect(homeHtml).not.toContain('66rem');
    expect(homeHtml).toContain('md:pb-[clamp(5.5rem,14dvh,10.5rem)]');
    expect(homeHtml).toContain('/ROG-Matrix-GeForce-SnapYT.App.webm');
    expect(homeHtml).not.toContain('data-testid="home-crt-toggle"');
    expect(homeHtml).not.toContain('>REC<');
    expect(homeHtml).not.toContain('>PAUSE<');
    expect(homeHtml).toContain('data-testid="home-ticker-toggle"');
    expect(homeHtml).toContain('data-testid="home-slider-card-cpu-cpu-amd-ryzen-7-9800x3d"');
    expect(homeHtml).not.toContain('data-testid="product-card-buy-now-cpu-amd-ryzen-7-9800x3d"');
    expect(homeHtml).toContain('items-end');
    expect(homeHtml).toContain('<span class="whitespace-nowrap">Precision-engineered</span>');
    expect(homeHtml).not.toContain('hero-tech-grid');
    expect(homeHtml).not.toContain('SYS.VER // 30TH-MTX');
    expect(homeHtml).not.toContain('X:1440 // Y:0509');
    expect(homeHtml).not.toContain('blur-3xl');
  });

  it('paginates CPU per brand (max 16/page), GPU flat (max 40/page), and Search tabs without <ul>/<ol>', () => {
    const intelItems = Array.from({ length: 21 }, (_, idx) => ({
      ...SECOND_CARD,
      id: `cpu-intel-${idx + 1}`,
      name: `Intel CPU ${idx + 1}`,
    }));
    const amdItems = Array.from({ length: 14 }, (_, idx) => ({
      ...SAMPLE_CARD,
      id: `cpu-amd-${idx + 1}`,
      name: `AMD CPU ${idx + 1}`,
    }));

    expect(paginateItems(intelItems, 1, 16).items).toHaveLength(16);
    expect(paginateItems(intelItems, 2, 16).items).toHaveLength(5);
    expect(buildPaginationTokens(1, 2)).toEqual([1, 2]);
    expect(buildPaginationTokens(5, 10)).toEqual([1, 'left-ellipsis', 4, 5, 6, 'right-ellipsis', 10]);

    const cpuCatalogHtml = renderToStaticMarkup(
      createElement(CatalogView, {
        state: {
          category: 'cpu',
          items: [...amdItems, ...intelItems],
          groupedByVendor: [
            { vendor: 'amd', items: amdItems },
            { vendor: 'intel', items: intelItems },
          ],
          total: 35,
          vendorTotals: { amd: 14, intel: 21 },
          pageSize: 16,
          pageByVendor: { amd: 1, intel: 1 },
          flatPage: 1,
          facets: { vendors: ['amd', 'intel'], sockets: ['AM5', 'LGA1700'], priceRange: null },
          selectedVendors: [],
          priceMinInput: '',
          priceMaxInput: '',
          priceSlider: {
            min: CATALOG_PRICE_SLIDER_MIN,
            max: CATALOG_PRICE_SLIDER_MAX,
            step: CATALOG_PRICE_SLIDER_STEP,
            ...clampPriceSliderBounds('', ''),
          },
          selectedVramGb: [],
          selectedAibBrands: [],
          selectedSockets: [],
          activeSeriesId: null,
          limitedOnly: false,
          sort: 'default',
          isLoading: false,
          isFetching: false,
          errorMessage: null,
        },
        actions: makeCatalogActions(),
      }),
    );

    expect(cpuCatalogHtml).toContain('data-testid="catalog-pagination-amd"');
    expect(cpuCatalogHtml).toContain('data-testid="catalog-pagination-page-intel-1"');
    expect(cpuCatalogHtml).toContain('data-testid="catalog-pagination-page-intel-2"');
    expect(cpuCatalogHtml).not.toContain('data-testid="catalog-pagination-page-amd-2"');
    expect(cpuCatalogHtml).not.toContain('<ul');
    expect(cpuCatalogHtml).not.toContain('<ol');

    const gpuItems = Array.from({ length: 71 }, (_, idx) => ({
      ...SAMPLE_CARD,
      id: `gpu-${idx + 1}`,
      category: 'gpu' as const,
      vendor: (idx < 50 ? 'nvidia' : 'amd') as 'nvidia' | 'amd',
      name: `GPU Model ${idx + 1}`,
    }));
    expect(paginateItems(gpuItems, 1, 40).items).toHaveLength(40);
    expect(paginateItems(gpuItems, 2, 40).items).toHaveLength(31);

    const paginationHtml = renderToStaticMarkup(
      createElement(CatalogPagination, {
        scope: 'gpu',
        currentPage: 1,
        totalItems: 71,
        pageSize: 40,
        onPageChange: vi.fn(),
      }),
    );
    expect(paginationHtml).toContain('data-testid="catalog-pagination-page-gpu-1"');
    expect(paginationHtml).toContain('data-testid="catalog-pagination-page-gpu-2"');
    expect(paginationHtml).not.toContain('<ul');

    const searchCpus = Array.from({ length: 14 }, (_, idx) => ({
      ...SAMPLE_CARD,
      id: `cpu-search-${idx + 1}`,
      name: `Ryzen Search ${idx + 1}`,
    }));
    const searchHtml = renderToStaticMarkup(
      createElement(SearchResultsView, {
        state: {
          query: 'Ryzen',
          validQuery: true,
          cpus: searchCpus,
          gpus: [],
          total: searchCpus.length,
          activeTab: 'all',
          sort: 'default',
          cpuPage: 1,
          gpuPage: 1,
          pageSize: 12,
          isLoading: false,
          errorMessage: null,
        },
        actions: {
          onBuyNow: vi.fn(),
          onAddToCart: vi.fn(),
          onCompare: vi.fn(),
          onChangeTab: vi.fn(),
          onChangeSort: vi.fn(),
          onChangeCpuPage: vi.fn(),
          onChangeGpuPage: vi.fn(),
        },
      }),
    );
    expect(searchHtml).toContain('data-testid="search-tab-all"');
    expect(searchHtml).toContain('data-testid="search-tab-cpu"');
    expect(searchHtml).toContain('data-testid="search-tab-gpu"');
    expect(searchHtml).toContain('data-testid="search-sort-select"');
    expect(searchHtml).toContain('data-testid="catalog-pagination-search-cpu"');
    expect(searchHtml).toContain('data-testid="catalog-pagination-page-search-cpu-2"');
    expect(searchHtml).not.toContain('<ul');
    expect(searchHtml).not.toContain('<ol');

    expect(clampPriceSliderBounds('50,000,000', '100,000,000')).toEqual({
      minValue: 50_000_000,
      maxValue: 100_000_000,
      minPct: ((50_000_000 - CATALOG_PRICE_SLIDER_MIN) / (CATALOG_PRICE_SLIDER_MAX - CATALOG_PRICE_SLIDER_MIN)) * 100,
      maxPct: ((100_000_000 - CATALOG_PRICE_SLIDER_MIN) / (CATALOG_PRICE_SLIDER_MAX - CATALOG_PRICE_SLIDER_MIN)) * 100,
    });

    const mixedGpuOrder = groupProductsByVendor(
      [
        { ...SAMPLE_CARD, id: 'g-amd', category: 'gpu', vendor: 'amd', name: 'AMD RX 9070 XT' },
        { ...SAMPLE_CARD, id: 'g-intel', category: 'gpu', vendor: 'intel', name: 'Intel Arc B580' },
        { ...SAMPLE_CARD, id: 'g-nv', category: 'gpu', vendor: 'nvidia', name: 'NVIDIA RTX 5090' },
      ],
      'gpu',
    );
    expect(mixedGpuOrder.map((g) => g.vendor)).toEqual(['nvidia', 'amd', 'intel']);
  });
});
