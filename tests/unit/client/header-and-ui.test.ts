import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { AnimatedCartButton } from '@/components/ui/AnimatedCartButton';
import { AnimatedCopyButton } from '@/components/ui/AnimatedCopyButton';
import { CatalogPagination, buildPaginationTokens } from '@/components/ui/CatalogPagination';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { DecryptedText } from '@/components/ui/DecryptedText';
import {
  FocusPullCarousel,
  computeFocusPullStyle,
  computeLoopProgress,
  computeNextStaggeredTickMs,
  wrapCarouselIndex,
} from '@/components/ui/FocusPullCarousel';
import { CartPlusIcon } from '@/components/ui/Icons';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { DEFAULT_IGNORE_CASCADE_SELECTOR } from '@/components/ui/ShapeGrid';
import { SpectrumLoader } from '@/components/ui/SpectrumLoader';
import { CatalogView } from '@/features/catalog/components/CatalogView';
import { paginateItems } from '@/features/catalog/useCatalogController';
import { GooeyNav } from '@/features/layout/GooeyNav';
import {
  DEFAULT_MUSIC_VOLUME,
  MusicPlayerBar,
  clampMusicVolume,
  readSavedMusicVolume,
} from '@/features/layout/MusicPlayerBar';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import {
  CATALOG_PRICE_SLIDER_MAX,
  CATALOG_PRICE_SLIDER_MIN,
  CATALOG_PRICE_SLIDER_STEP,
  clampPriceSliderBounds,
} from '@/features/catalog/useCatalogController';
import { CompareTableView } from '@/features/compare/components/CompareTableView';
import { HomeView } from '@/features/home/components/HomeView';
import { InteractiveBackground } from '@/features/layout/InteractiveBackground';
import {
  CATALOG_CONTAINER_CLASS,
  CENTERED_CONTAINER_CLASS,
  WIDE_CONTAINER_CLASS,
  getChromeContainerClass,
  getMainContainerClass,
  isWideContainerRoute,
} from '@/features/layout/layout-width';
import { ZaloButton } from '@/features/layout/ZaloButton';
import { OrderBoardView } from '@/features/orders/components/OrderBoardView';
import { OrderStatusModal } from '@/features/orders/components/OrderStatusModal';
import { ProductDetailView } from '@/features/product-detail/components/ProductDetailView';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  CompareResponse,
  OrderBoard,
  ProductCard as ProductCardDto,
  ProductDetail,
} from '@/shared/types';

const mockUseAuthSession = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/features/auth/useAuthSession', () => ({
  useAuthSession: () => mockUseAuthSession(),
}));

vi.mock('@/features/cart/store', () => ({
  useCartStore: (selector: (state: { items: []; hasHydrated: boolean }) => unknown) =>
    selector({ items: [], hasHydrated: true }),
}));

vi.mock('@/features/search/SearchBar', () => ({
  SearchBar: () => null,
}));

const { Header } = await import('@/features/layout/Header');

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

describe('UI polish, Crimson Matrix dual-theme, Lucide icons, and admin navigation rules', () => {
  beforeEach(() => {
    mockUseAuthSession.mockReset();
  });

  it('shows order lookup tab for guests/customers, hides it in admin mode, and renders CoolThemeToggle switch', () => {
    mockUseAuthSession.mockReturnValue({
      state: { user: null, isLoggingOut: false },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const guestHtml = renderToStaticMarkup(createElement(Header));
    expect(guestHtml).toContain('href="/orders/lookup"');
    expect(guestHtml).toContain(VI_MESSAGES.nav.orderLookup);
    expect(guestHtml).toContain('data-testid="header-music-bar"');
    expect(guestHtml).toContain('data-testid="header-music-prev"');
    expect(guestHtml).toContain('data-testid="header-music-toggle"');
    expect(guestHtml).toContain('data-testid="header-music-next"');
    expect(guestHtml).not.toContain('<ul');
    expect(guestHtml).not.toContain('<ol');
    expect(guestHtml).toContain('data-testid="header-theme-toggle"');
    expect(guestHtml).toContain('role="switch"');
    expect(guestHtml).toContain('lucide-sun');
    expect(guestHtml).toContain('lucide-moon');
    expect(guestHtml).toContain('lucide-cloud');
    expect(guestHtml).toContain('lucide-star');
    expect(guestHtml).not.toContain('toggles.dev-within-main');
    expect(guestHtml).not.toContain('md:sticky md:top-0');
    expect(guestHtml).not.toContain('data-testid="header-floating-nav"');

    mockUseAuthSession.mockReturnValue({
      state: {
        user: {
          id: 'user-customer',
          username: 'khach',
          displayName: 'Khách',
          avatarUrl: null,
          role: 'customer',
        },
        isLoggingOut: false,
      },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const customerHtml = renderToStaticMarkup(createElement(Header));
    expect(customerHtml).toContain('href="/orders/lookup"');

    mockUseAuthSession.mockReturnValue({
      state: {
        user: {
          id: 'admin',
          username: 'admin',
          displayName: 'Admin',
          avatarUrl: null,
          role: 'admin',
        },
        isLoggingOut: false,
      },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const adminHtml = renderToStaticMarkup(createElement(Header));
    expect(adminHtml).not.toContain('href="/orders/lookup"');
    expect(adminHtml).not.toContain(VI_MESSAGES.nav.orderLookup);
    expect(adminHtml).toContain('href="/admin"');
  });

  it('renders ZaloButton as a circular icon-only heartbeat bubble with dual radar ripple', () => {
    const html = renderToStaticMarkup(createElement(ZaloButton));
    expect(html).toContain('data-testid="zalo-float-button"');
    expect(html).toContain('zalo-heartbeat');
    expect(html).toContain('zalo-pulse-ring');
    expect(html).toContain('zalo-pulse-ring-delay');
    expect(html).toContain('h-14 w-14');
    expect(html).toContain('rounded-full');
    expect(html).not.toContain('>Zalo<');
  });

  it('renders interactive ShapeGrid canvas background synced cleanly to dark/light themes', () => {
    const bgHtml = renderToStaticMarkup(createElement(InteractiveBackground));
    expect(bgHtml).toContain('data-testid="layout-interactive-bg"');
    expect(bgHtml).toContain('aria-hidden="true"');
    expect(bgHtml).toContain('fixed inset-0 z-0');
    expect(bgHtml).toContain('data-theme-variant="dark"');
    expect(bgHtml).toContain('<canvas');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('header');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('nav');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('header-floating-nav');
  });

  it('routes landing full-bleed first fold, 1760px catalog chrome/grids, and 1440px balanced sections', () => {
    expect(WIDE_CONTAINER_CLASS).toContain('max-w-[1440px]');
    expect(CATALOG_CONTAINER_CLASS).toContain('max-w-[1760px]');
    expect(isWideContainerRoute('/')).toBe(true);
    expect(isWideContainerRoute('/cpu')).toBe(true);
    expect(isWideContainerRoute('/gpu')).toBe(true);
    expect(isWideContainerRoute('/checkout')).toBe(false);
    expect(isWideContainerRoute('/orders/lookup')).toBe(false);
    expect(isWideContainerRoute('/policies/warranty')).toBe(false);
    expect(isWideContainerRoute(null)).toBe(false);

    expect(getMainContainerClass('/')).toBe('w-full flex-1 pb-6');
    expect(getMainContainerClass('/cpu')).toContain('max-w-[1760px]');
    expect(getMainContainerClass('/gpu')).toContain('max-w-[1760px]');
    expect(getMainContainerClass('/checkout')).toContain(CENTERED_CONTAINER_CLASS);

    expect(getChromeContainerClass()).toBe(WIDE_CONTAINER_CLASS);
  });

  it('clamps catalog dual-range price slider bounds safely and renders sticky filter rail', () => {
    expect(clampPriceSliderBounds('', '')).toEqual({
      minValue: CATALOG_PRICE_SLIDER_MIN,
      maxValue: CATALOG_PRICE_SLIDER_MAX,
      minPct: 0,
      maxPct: 100,
    });

    const subMin = clampPriceSliderBounds('2749000', '50000000');
    expect(subMin.minValue).toBe(CATALOG_PRICE_SLIDER_MIN);
    expect(subMin.maxValue).toBe(50_000_000);

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
          pageSize: 40,
          pageByVendor: {},
          flatPage: 1,
          facets: { vendors: ['amd'], vramGb: [16], aibBrands: ['Sapphire'], priceRange: null },
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
          limitedOnly: false,
          sort: 'default',
          isLoading: false,
          errorMessage: null,
        },
        actions: {
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
        },
      }),
    );

    expect(catalogHtml).toContain('lg:sticky');
    expect(catalogHtml).toContain('lg:top-[4.75rem]');
    expect(catalogHtml).toContain('2xl:grid-cols-4');
    expect(catalogHtml).not.toContain('max-h-48');
    expect(catalogHtml).toContain('data-testid="filter-price-slider-min"');
    expect(catalogHtml).toContain('data-testid="filter-price-slider-max"');
    expect(catalogHtml).toContain('min="5000000"');
    expect(catalogHtml).toContain('max="300000000"');
  });

  it('renders Lucide icons for CartPlusIcon and SearchableSelect', () => {
    const cartHtml = renderToStaticMarkup(createElement(CartPlusIcon));
    expect(cartHtml).toContain('lucide');

    const selectHtml = renderToStaticMarkup(
      createElement(SearchableSelect, {
        label: 'CPU',
        value: '',
        groups: [],
        placeholder: 'Chọn CPU',
        onChange: vi.fn(),
      }),
    );
    expect(selectHtml).toContain('lucide-chevron-down');
  });

  it('renders reworked OrderBoardView progress bar with solid icon backing and preserved stage contracts', () => {
    const board: OrderBoard = {
      orderId: 'ORD-20261121-0001',
      stage: 2,
      isCompleted: false,
      createdAt: '2026-11-21T10:00:00Z',
      paymentMethod: 'cod',
      paymentReference: 'COD-0001',
      customer: {
        fullName: 'Nguyen Van A',
        phoneMasked: '090***6789',
        addressLine: '123 Duong ABC, Phuong 1, TP HCM',
        note: null,
      },
      items: [
        {
          productName: SAMPLE_CARD.name,
          category: 'cpu',
          imageUrl: '/icons/order-thumb-test.png',
          unitPriceVnd: SAMPLE_CARD.priceVnd,
          quantity: 1,
          lineTotalVnd: SAMPLE_CARD.priceVnd,
        },
      ],
      totalQuantity: 1,
      subtotalVnd: SAMPLE_CARD.priceVnd,
      shippingFeeVnd: 200_000,
      totalVnd: SAMPLE_CARD.priceVnd + 200_000,
      stages: [
        { stage: 0, label: VI_MESSAGES.orders.stages[0], reachedAt: '2026-11-21T10:00:00Z' },
        { stage: 1, label: VI_MESSAGES.orders.stages[1], reachedAt: '2026-11-21T10:05:00Z' },
        { stage: 2, label: VI_MESSAGES.orders.stages[2], reachedAt: '2026-11-21T10:10:00Z' },
        { stage: 3, label: VI_MESSAGES.orders.stages[3], reachedAt: null },
        { stage: 4, label: VI_MESSAGES.orders.stages[4], reachedAt: null },
      ],
    };

    const html = renderToStaticMarkup(
      createElement(OrderBoardView, {
        state: {
          orderId: board.orderId,
          board,
          isLoading: false,
          fetchError: null,
          needsLookup: false,
          lookupPhone: '',
          lookupError: null,
          isLookingUp: false,
          isAdvancing: false,
        },
        actions: {
          onCopyOrderId: vi.fn(),
          onAdvanceStage: vi.fn(),
          onChangeLookupPhone: vi.fn(),
          onSubmitLookup: vi.fn(),
        },
      }),
    );

    expect(html).toContain('data-testid="order-stage-0"');
    expect(html).toContain('data-testid="order-stage-2"');
    expect(html).toContain('data-testid="order-stage-4"');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('data-reached="true"');
    expect(html).toContain('data-reached="false"');
    expect(html).toContain('relative z-10 shrink-0 bg-surface p-1');
    expect(html).toContain('lucide');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('src="/icons/order-thumb-test.png"');
    expect(html).toContain(`alt="${SAMPLE_CARD.name}"`);
    expect(html).not.toContain('opacity-60');

    const modalHtml = renderToStaticMarkup(
      createElement(OrderStatusModal, {
        placedOrder: { order: board, accessToken: 'tok-test' },
        isAdvancing: false,
        onCopyOrderId: vi.fn(),
        onAdvanceStage: vi.fn(),
        onContinueShopping: vi.fn(),
        onViewMyOrders: vi.fn(),
        onClose: vi.fn(),
      }),
    );
    expect(modalHtml).toContain('<dialog');
    expect(modalHtml).toContain('data-testid="order-placed-modal"');
    expect(modalHtml).toContain('data-testid="order-id-display"');
    expect(modalHtml).toContain('data-testid="order-id-copy"');
    expect(modalHtml).toContain('data-testid="order-stage-2"');
    expect(modalHtml).toContain('data-testid="order-demo-advance"');
    expect(modalHtml).toContain('data-testid="order-placed-continue-shopping"');
    expect(modalHtml).toContain('data-testid="order-placed-my-orders"');
    expect(modalHtml).toContain('data-testid="order-placed-close-view"');
    expect(modalHtml).toContain('src="/icons/order-thumb-test.png"');
    expect(modalHtml).not.toContain('<ul');
    expect(modalHtml).not.toContain('<ol');
  });

  it('keeps compare top slot preview as thumbnail, enlarges criteria header image, and uses Hero CRT video without blur glows', () => {
    const compareData: CompareResponse = {
      category: 'cpu',
      products: [
        {
          id: SAMPLE_CARD.id,
          name: SAMPLE_CARD.name,
          priceVnd: SAMPLE_CARD.priceVnd,
          imageUrl: SAMPLE_CARD.imageUrl,
        },
        {
          id: SECOND_CARD.id,
          name: SECOND_CARD.name,
          priceVnd: SECOND_CARD.priceVnd,
          imageUrl: SECOND_CARD.imageUrl,
        },
      ],
      rows: [
        {
          key: 'price',
          label: 'Giá bán',
          unit: 'VND',
          rule: 'lower',
          cells: [
            { display: '13.490.000 đ', highlighted: true },
            { display: '14.990.000 đ', highlighted: false },
          ],
        },
      ],
      notes: [],
    };

    const compareHtml = renderToStaticMarkup(
      createElement(CompareTableView, {
        state: {
          slots: [SAMPLE_CARD.id, SECOND_CARD.id, null],
          selectedProducts: [SAMPLE_CARD, SECOND_CARD, null],
          showThirdColumn: false,
          lockedCategory: 'cpu',
          cpus: [SAMPLE_CARD, SECOND_CARD],
          gpus: [],
          isLoadingCatalog: false,
          catalogErrorMessage: null,
          data: compareData,
          isLoadingCompare: false,
          compareErrorMessage: null,
        },
        actions: {
          onSelectSlot: vi.fn(),
          onClearSlot: vi.fn(),
          onAddColumn: vi.fn(),
          onClearAll: vi.fn(),
          onRetryCatalog: vi.fn(),
        },
      }),
    );

    const previewIdx = compareHtml.indexOf('data-testid="compare-slot-preview-0"');
    const previewSnippet = compareHtml.slice(previewIdx, previewIdx + 450);
    expect(previewSnippet).toContain('h-20 w-20');
    expect(previewSnippet).not.toContain('zoom-frame-cursor');

    const headerIdx = compareHtml.indexOf('compare-table');
    const tableSnippet = compareHtml.slice(headerIdx, compareHtml.indexOf('<tbody>'));
    expect(tableSnippet).toContain('zoom-frame-cursor');
    expect(tableSnippet).toContain('aspect-square');
    expect(tableSnippet).toContain(`data-testid="compare-header-image-${SAMPLE_CARD.id}"`);

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
    expect(homeHtml).toContain('Raw Compute.');
    expect(homeHtml).toContain('hero-dark-stage');
    expect(homeHtml).toContain('hero-video-mask');
    expect(homeHtml).toContain('hero-video-fade');
    expect(homeHtml).toContain('lg:pb-[clamp(8.5rem,24dvh,14.5rem)]');
    expect(homeHtml).toContain('/ROG-Matrix-GeForce-SnapYT.App.webm');
    expect(homeHtml).toContain('data-testid="home-crt-toggle"');
    expect(homeHtml).toContain('data-testid="home-ticker-toggle"');
    expect(homeHtml).toContain('data-testid="home-slider-card-cpu-cpu-amd-ryzen-7-9800x3d"');
    expect(homeHtml).not.toContain('data-testid="product-card-buy-now-cpu-amd-ryzen-7-9800x3d"');
    expect(homeHtml).toContain('items-end');
    expect(homeHtml).toContain('sm:right-24');
    expect(homeHtml).toContain('<span class="whitespace-nowrap">Precision-engineered</span>');
    expect(homeHtml).not.toContain('hero-tech-grid');
    expect(homeHtml).not.toContain('SYS.VER // 30TH-MTX');
    expect(homeHtml).not.toContain('X:1440 // Y:0509');
    expect(homeHtml).not.toContain('blur-3xl');
  });

  it('paginates CPU per brand (max 16/page) and GPU at bottom (max 40/page) without <ul>/<ol>', () => {
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
          limitedOnly: false,
          sort: 'default',
          isLoading: false,
          errorMessage: null,
        },
        actions: {
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
        },
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
  });

  it('renders new UI primitives (DecryptedText, FocusPullCarousel, SpectrumLoader, Copy, Cart, AlertDialog, Combobox)', () => {
    const decryptHtml = renderToStaticMarkup(createElement(DecryptedText, { text: 'Raw Compute.' }));
    expect(decryptHtml).toContain('aria-label="Raw Compute."');

    expect(computeFocusPullStyle(0, 6.5)).toEqual({
      scale: 1,
      blur: 0,
      opacity: 1,
      saturate: 1,
    });
    expect(computeFocusPullStyle(1, 6.5)).toEqual({
      scale: 0.86,
      blur: 6.5,
      opacity: 0.5,
      saturate: 0.55,
    });
    expect(wrapCarouselIndex(-1, 5)).toBe(4);
    expect(wrapCarouselIndex(5, 5)).toBe(0);
    expect(computeNextStaggeredTickMs(1000, 1000, 2000, 0)).toBe(3000);
    expect(computeNextStaggeredTickMs(3002, 1000, 2000, 0)).toBe(5000);
    expect(computeNextStaggeredTickMs(1000, 1000, 2000, 1000)).toBe(4000);
    expect(computeNextStaggeredTickMs(4003, 1000, 2000, 1000)).toBe(6000);
    expect(computeLoopProgress(100, [100, 500, 900, 1300, 1700], 5, true)).toBe(0);
    expect(computeLoopProgress(900, [100, 500, 900, 1300, 1700], 5, true)).toBe(0.5);
    expect(computeLoopProgress(1700, [100, 500, 900, 1300, 1700], 5, true)).toBe(1);
    expect(computeLoopProgress(1900, [100, 500, 900, 1300, 1700], 5, true)).toBeCloseTo(0.5, 4);

    const fiveCards = Array.from({ length: 5 }, (_, idx) => ({
      ...SAMPLE_CARD,
      id: `cpu-test-${idx + 1}`,
      name: `CPU Test ${idx + 1}`,
    }));
    const sliderHtml = renderToStaticMarkup(
      createElement(FocusPullCarousel, {
        category: 'cpu',
        items: fiveCards,
        autoplayMs: 2000,
        loop: true,
      }),
    );
    expect(sliderHtml).toContain('data-testid="home-slider-prev-cpu"');
    expect(sliderHtml).toContain('data-testid="home-slider-next-cpu"');
    expect(sliderHtml).toContain('data-testid="home-slider-play-cpu"');
    expect((sliderHtml.match(/class="fp-card"/g) ?? []).length).toBe(15);
    expect(
      (sliderHtml.match(/data-testid="home-slider-card-cpu-cpu-test-1"/g) ?? []).length,
    ).toBe(1);
    expect(sliderHtml).toContain('fp-root');
    expect(sliderHtml).toContain('fp-track');
    expect(sliderHtml).toContain('fp-bar');
    expect(sliderHtml).toContain('01');
    expect(sliderHtml).toContain('05');
    expect(sliderHtml).toContain('<img');
    expect(sliderHtml).not.toContain('<ul');
    expect(sliderHtml).not.toContain('<ol');

    const loaderHtml = renderToStaticMarkup(createElement(SpectrumLoader));
    expect(loaderHtml).toContain('#D71920');
    expect(loaderHtml).toContain('#FB7185');
    expect(loaderHtml).not.toContain('#00ff19');

    const copyHtml = renderToStaticMarkup(
      createElement(AnimatedCopyButton, { textToCopy: 'PC-TEST1234', label: 'Sao chép' }),
    );
    expect(copyHtml).toContain('lucide-copy');

    const cartBtnHtml = renderToStaticMarkup(
      createElement(AnimatedCartButton, {
        ariaLabel: 'Thêm sản phẩm',
        testId: 'test-cart-btn',
        onAdd: vi.fn(),
      }),
    );
    expect(cartBtnHtml).toContain('h-11 w-11');

    const comboHtml = renderToStaticMarkup(
      createElement(ComboboxSelect, {
        label: 'Sắp xếp',
        value: 'default',
        options: [{ value: 'default', label: 'Mặc định' }],
        onChange: vi.fn(),
      }),
    );
    expect(comboHtml).toContain('lucide-chevron-down');

    const alertHtml = renderToStaticMarkup(
      createElement(AlertDialog, {
        open: true,
        title: 'Xóa',
        description: 'Xác nhận xóa',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
      }),
    );
    expect(alertHtml).toContain('<dialog');

    const gooeyHtml = renderToStaticMarkup(
      createElement(GooeyNav, {
        items: [
          { href: '/cpu', label: 'CPU' },
          { href: '/orders/lookup', label: 'Tra cứu đơn hàng' },
        ],
        activeHref: '/cpu',
      }),
    );
    expect(gooeyHtml).toContain('<canvas');
    expect(gooeyHtml).toContain('role="list"');
    expect(gooeyHtml).toContain('w-fit');
    expect(gooeyHtml).not.toContain('<ul');
    expect(gooeyHtml).not.toContain('<ol');

    expect(DEFAULT_MUSIC_VOLUME).toBe(0.2);
    expect(clampMusicVolume(1.5)).toBe(1);
    expect(clampMusicVolume(-0.2)).toBe(0);
    expect(clampMusicVolume(Number.NaN)).toBe(0.2);
    expect(readSavedMusicVolume({ getItem: () => '0.65' })).toBe(0.65);
    expect(readSavedMusicVolume({ getItem: () => null })).toBe(0.2);

    const playerHtml = renderToStaticMarkup(createElement(MusicPlayerBar));
    expect(playerHtml).toContain('data-testid="header-music-bar"');
    expect(playerHtml).toContain('data-testid="header-music-volume-toggle"');
    expect(playerHtml).toContain('mr-6');
    expect(playerHtml).toContain('animate-spin');
    expect(playerHtml).toContain('blur-xl');
  });
});
