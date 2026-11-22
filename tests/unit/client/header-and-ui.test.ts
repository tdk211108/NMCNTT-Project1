import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { AnimatedCartButton } from '@/components/ui/AnimatedCartButton';
import { AnimatedCopyButton } from '@/components/ui/AnimatedCopyButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
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
import { ToastContainer, ToastItemCard } from '@/components/ui/Toast';
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
import { ComboAdvisorView } from '@/features/combo/components/ComboAdvisorView';
import { HomeView } from '@/features/home/components/HomeView';
import { PerfPerPriceView } from '@/features/perf-per-price/components/PerfPerPriceView';
import { UpgradeAdvisorView } from '@/features/upgrade/components/UpgradeAdvisorView';
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
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import { ProductDetailView } from '@/features/product-detail/components/ProductDetailView';
import { SearchResultsView } from '@/features/search/components/SearchResultsView';
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

const { Header, FloatingNavBar } = await import('@/features/layout/Header');

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
    expect(guestHtml).toContain('href="/tools/perf-per-price"');
    expect(guestHtml).toContain('data-testid="header-tools-dropdown"');
    expect(guestHtml).toContain(VI_MESSAGES.nav.tools);
    expect(guestHtml).not.toContain('href="/compare"');
    expect(guestHtml.indexOf('data-testid="header-tools-dropdown"')).toBeLessThan(
      guestHtml.indexOf('href="/tools/perf-per-price"'),
    );
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
          activeSeriesId: null,
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
          onBuyNowProduct: vi.fn(),
          onAddToCartProduct: vi.fn(),
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
    expect(tableSnippet).toContain(`data-testid="compare-buy-now-${SAMPLE_CARD.id}"`);
    expect(tableSnippet).toContain(`data-testid="compare-add-to-cart-${SAMPLE_CARD.id}"`);

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
          activeSeriesId: null,
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
    expect(playerHtml).toContain('data-sfx="none"');
    expect(playerHtml).toContain('mr-6');
    expect(playerHtml).toContain('animate-spin');
    expect(playerHtml).toContain('blur-xl');
  });

  it('renders Cyber Glitch Buttons, SFX toggle (default ON), SearchableSelect errors, Breadcrumb, Search tabs/pagination, and PolicyLayout without <ul>/<ol>', () => {
    mockUseAuthSession.mockReturnValue({
      state: { user: null, isLoggingOut: false },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const headerHtml = renderToStaticMarkup(createElement(Header));
    expect(headerHtml).toContain('data-testid="header-sfx-toggle"');
    expect(headerHtml).toContain('aria-pressed="true"');
    expect(headerHtml.indexOf('data-testid="header-sfx-toggle"')).toBeLessThan(
      headerHtml.indexOf('data-testid="header-cart-link"'),
    );

    const floatingHtml = renderToStaticMarkup(
      createElement(FloatingNavBar, {
        containerClass: 'mx-auto w-full max-w-[1440px]',
        pathname: '/cpu',
        isAdmin: false,
        totalCartCount: 2,
        authState: { user: null, isLoggingOut: false },
        authActions: { openAuthModal: vi.fn(), logout: vi.fn() },
      }),
    );
    expect(floatingHtml).toContain('data-testid="header-floating-nav"');
    expect(floatingHtml).toContain('data-testid="floating-tools-dropdown"');
    expect(floatingHtml).toContain('data-testid="header-floating-cart-link"');
    expect(floatingHtml).toContain('data-testid="header-floating-theme-toggle"');
    expect(floatingHtml).not.toContain('data-testid="header-sfx-toggle"');
    expect(floatingHtml).not.toContain('floating-sfx-toggle');
    const floatingBrandNavGapIdx = floatingHtml.indexOf('gap-3 lg:gap-5');
    expect(floatingBrandNavGapIdx).toBeGreaterThan(-1);
    expect(floatingHtml.indexOf('Điều hướng nhanh', floatingBrandNavGapIdx)).toBeGreaterThan(
      floatingHtml.indexOf(VI_MESSAGES.brand.name, floatingBrandNavGapIdx),
    );

    const toastHostHtml = renderToStaticMarkup(createElement(ToastContainer));
    expect(toastHostHtml).toContain('role="region"');
    expect(toastHostHtml).not.toContain('<ul');
    expect(toastHostHtml).not.toContain('<ol');

    const baseHotToast = {
      id: 'toast-1',
      type: 'custom' as const,
      message: '',
      pauseDuration: 0,
      createdAt: 0,
      visible: true,
      dismissed: false,
      ariaProps: { role: 'status' as const, 'aria-live': 'polite' as const },
    };
    const successToastHtml = renderToStaticMarkup(
      createElement(ToastItemCard, {
        toast: baseHotToast,
        message: 'Đã thêm sản phẩm vào giỏ.',
        tone: 'success',
      }),
    );
    expect(successToastHtml).toContain('data-toast-tone="success"');
    expect(successToastHtml).toContain('mtx-toast-enter');
    expect(successToastHtml).toContain('role="status"');
    expect(successToastHtml).toContain(`aria-label="${VI_MESSAGES.common.close}"`);
    expect(successToastHtml).not.toContain('<ul');
    expect(successToastHtml).not.toContain('<ol');

    const exitErrorToastHtml = renderToStaticMarkup(
      createElement(ToastItemCard, {
        toast: { ...baseHotToast, id: 'toast-2', visible: false },
        message: 'Không thể xử lý yêu cầu.',
        tone: 'error',
      }),
    );
    expect(exitErrorToastHtml).toContain('data-toast-tone="error"');
    expect(exitErrorToastHtml).toContain('mtx-toast-exit');

    const cyberBtnHtml = renderToStaticMarkup(
      createElement(Button, { variant: 'primary', cyberTag: '01' }, 'Đặt hàng'),
    );
    expect(cyberBtnHtml).toContain('mtx-cyber-btn');
    expect(cyberBtnHtml).toContain('mtx-cyber-primary');
    expect(cyberBtnHtml).toContain('mtx-cyber-face');
    expect(cyberBtnHtml).toContain('mtx-cyber-glitch');
    expect(cyberBtnHtml).toContain('mtx-cyber-tag');
    expect(cyberBtnHtml).toContain('01');

    const flatChipHtml = renderToStaticMarkup(
      createElement(Button, { variant: 'outline', cyber: false, sfx: 'toggle' }, 'AMD'),
    );
    expect(flatChipHtml).not.toContain('mtx-cyber-btn');
    expect(flatChipHtml).toContain('data-sfx="toggle"');

    const demoBtnHtml = renderToStaticMarkup(
      createElement(Button, { variant: 'demo' }, '[Demo Control]'),
    );
    expect(demoBtnHtml).not.toContain('mtx-cyber-btn');
    expect(demoBtnHtml).toContain('border-dashed');

    const selectErrHtml = renderToStaticMarkup(
      createElement(SearchableSelect, {
        label: 'Tỉnh / Thành phố',
        value: '',
        groups: [],
        placeholder: 'Chọn Tỉnh / Thành phố',
        error: 'Vui lòng chọn Tỉnh / Thành phố.',
        triggerTestId: 'checkout-province',
        onChange: vi.fn(),
      }),
    );
    expect(selectErrHtml).toContain('aria-invalid="true"');
    expect(selectErrHtml).toContain('role="alert"');
    expect(selectErrHtml).toContain('border-danger');

    const breadcrumbHtml = renderToStaticMarkup(
      createElement(Breadcrumb, {
        items: [
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.nav.cpu, href: '/cpu' },
          { label: SAMPLE_CARD.name, href: `/products/${SAMPLE_CARD.id}` },
        ],
      }),
    );
    expect(breadcrumbHtml).toContain('<nav');
    expect(breadcrumbHtml).toContain('aria-current="page"');
    expect(breadcrumbHtml).not.toContain('<ul');
    expect(breadcrumbHtml).not.toContain('<ol');

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

    const policyHtml = renderToStaticMarkup(
      createElement(
        PolicyLayout,
        {
          activePath: '/policies/warranty',
          title: VI_MESSAGES.policies.warrantyTitle,
        },
        createElement('p', null, 'Nội dung chính sách'),
      ),
    );
    expect(policyHtml).toContain('font-display');
    expect(policyHtml).toContain('href="/policies/privacy"');
    expect(policyHtml).toContain('aria-current="page"');
    expect(policyHtml).not.toContain('<ul');
    expect(policyHtml).not.toContain('<ol');

    const comboHtml = renderToStaticMarkup(
      createElement(ComboAdvisorView, {
        state: {
          budgetInput: '20000000',
          budgetError: null,
          purpose: 'gaming_aaa',
          cpuVendor: null,
          gpuVendor: null,
          appliedBudgetVnd: 20_000_000,
          isLoading: false,
          errorMessage: null,
          data: {
            budgetVnd: 20_000_000,
            purpose: 'gaming_aaa',
            targetGpuSharePct: 65,
            targetCpuSharePct: 35,
            minAvailableComboPriceVnd: 11_000_000,
            cheapestReferenceCombo: null,
            notes: [VI_MESSAGES.tools.combo.budgetScopeNote],
            combos: [
              {
                rank: 1,
                role: 'best_overall',
                cpu: {
                  id: SAMPLE_CARD.id,
                  name: SAMPLE_CARD.name,
                  vendor: 'amd',
                  socket: 'AM5',
                  coresTotal: 8,
                  threadsTotal: 16,
                  psuPowerW: 162,
                  priceVnd: 8_000_000,
                  imageUrl: null,
                  score: { raw: 40000, normalized: 95.2 },
                },
                gpu: {
                  id: 'gpu-1',
                  seriesId: 'gs-rtx-5060',
                  seriesName: 'RTX 5060',
                  name: 'MSI RTX 5060',
                  vendor: 'nvidia',
                  aibBrand: 'MSI',
                  vramGb: 8,
                  tbpW: 145,
                  priceVnd: 12_000_000,
                  imageUrl: null,
                  score: { raw: 20581, normalized: 52.7 },
                },
                totalPriceVnd: 20_000_000,
                budgetDeltaVnd: 0,
                isOverBudget: false,
                overBudgetPct: null,
                actualGpuSharePct: 60,
                actualCpuSharePct: 40,
                compositeScore: 67.5,
                perfPerPrice: 3.38,
                psu: {
                  exactW: 508.75,
                  recommendedTierW: 550,
                  exceedsMaxTier: false,
                  psuHref: '/tools/psu?cpu=store:cpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5060',
                },
              },
              {
                rank: 3,
                role: 'performance_stretch',
                cpu: {
                  id: SAMPLE_CARD.id,
                  name: SAMPLE_CARD.name,
                  vendor: 'amd',
                  socket: 'AM5',
                  coresTotal: 8,
                  threadsTotal: 16,
                  psuPowerW: 162,
                  priceVnd: 8_000_000,
                  imageUrl: null,
                  score: { raw: 40000, normalized: 95.2 },
                },
                gpu: {
                  id: 'gpu-2',
                  seriesId: 'gs-rtx-5060-ti-8gb',
                  seriesName: 'RTX 5060 Ti',
                  name: 'ASUS RTX 5060 Ti',
                  vendor: 'nvidia',
                  aibBrand: 'ASUS',
                  vramGb: 8,
                  tbpW: 180,
                  priceVnd: 12_800_000,
                  imageUrl: null,
                  score: { raw: 21773, normalized: 55.8 },
                },
                totalPriceVnd: 20_800_000,
                budgetDeltaVnd: -800_000,
                isOverBudget: true,
                overBudgetPct: 4.0,
                actualGpuSharePct: 62,
                actualCpuSharePct: 38,
                compositeScore: 69.6,
                perfPerPrice: 3.35,
                psu: {
                  exactW: 552.5,
                  recommendedTierW: 650,
                  exceedsMaxTier: false,
                  psuHref: '/tools/psu?cpu=store:cpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5060-ti-8gb',
                },
              },
            ],
          },
        },
        actions: {
          onChangeBudgetInput: vi.fn(),
          onSelectBudgetPreset: vi.fn(),
          onSelectPurpose: vi.fn(),
          onSelectCpuVendor: vi.fn(),
          onSelectGpuVendor: vi.fn(),
          onSubmit: vi.fn(),
          onApplyMinBudget: vi.fn(),
          onAddBothToCart: vi.fn(),
        },
      }),
    );
    expect(comboHtml).toContain('data-testid="combo-budget-input"');
    expect(comboHtml).toContain('data-testid="combo-card-1"');
    expect(comboHtml).toContain('data-testid="combo-stretch-badge-3"');
    expect(comboHtml).toContain('Lựa chọn 1: Tối ưu nhất');
    expect(comboHtml).toContain('Lựa chọn 3: Nâng tầm hiệu năng');
    expect(comboHtml).not.toContain('Nguồn khuyến nghị');
    expect(comboHtml).toContain('data-testid="combo-add-both-1"');
    expect(comboHtml).toContain('data-testid="combo-psu-link-1"');
    expect(comboHtml).toContain('bi-cpu');
    expect(comboHtml).toContain('bi-gpu-card');
    expect(comboHtml).not.toContain('<ul');
    expect(comboHtml).not.toContain('<ol');

    const upgradeCpuHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: {
          category: 'cpu',
          currentId: 'store:cpu-i5-12400f',
          budgetInput: '',
          budgetError: null,
          sameSocketOnly: false,
          sameSocketAvailable: true,
          availableVendors: ['intel', 'amd'],
          selectedVendors: [],
          sort: 'recommended',
          retailCpuOptions: [],
          legacyCpuOptions: [],
          retailGpuOptions: [],
          legacyGpuOptions: [],
          isLoadingOptions: false,
          optionsErrorMessage: null,
          isLoadingRecommendations: false,
          errorMessage: null,
          data: {
            category: 'cpu',
            current: {
              id: 'store:cpu-i5-12400f',
              retailProductId: 'cpu-i5-12400f',
              category: 'cpu',
              source: 'store',
              name: 'Intel Core i5-12400F',
              vendor: 'intel',
              socket: 'LGA1700',
              coresTotal: 6,
              threadsTotal: 12,
              psuPowerW: 117,
              ramSupport: 'DDR5-4800 / DDR4-3200',
              vramGb: null,
              tbpW: null,
              passmarkRaw: 19520,
              normalizedScore: 27.8,
              hasPassmark: true,
            },
            hasSameSocketInCatalog: true,
            isTopTier: false,
            minUpgradePriceVnd: 7_690_000,
            sameSocketCpus: [
              {
                id: 'cpu-i5-14600k',
                name: 'Intel Core i5-14600K',
                vendor: 'intel',
                priceVnd: 7_690_000,
                imageUrl: null,
                socket: 'LGA1700',
                coresTotal: 14,
                threadsTotal: 20,
                psuPowerW: 181,
                ramSupport: 'DDR5-5600 / DDR4-3200',
                score: { raw: 38341, normalized: 54.7 },
                perfPerPrice: 7.11,
                upliftPct: 96,
                sameSocket: true,
                warnings: [
                  {
                    code: 'cpu_power_increase',
                    severity: 'medium',
                    deltaValue: 64,
                    fromWatt: 117,
                    toWatt: 181,
                  },
                ],
                psuHref: '/tools/psu?cpu=store:cpu-i5-14600k',
                compareHref: '/compare?ids=cpu-i5-12400f,cpu-i5-14600k',
              },
            ],
            platformSwapCpus: [
              {
                id: 'cpu-r7-9800x3d',
                name: 'AMD Ryzen 7 9800X3D',
                vendor: 'amd',
                priceVnd: 14_390_000,
                imageUrl: null,
                socket: 'AM5',
                coresTotal: 8,
                threadsTotal: 16,
                psuPowerW: 162,
                ramSupport: 'DDR5-5600',
                score: { raw: 39911, normalized: 56.9 },
                perfPerPrice: 3.95,
                upliftPct: 104,
                sameSocket: false,
                warnings: [
                  {
                    code: 'socket_change',
                    severity: 'high',
                    fromLabel: 'LGA1700',
                    toLabel: 'AM5',
                  },
                ],
                psuHref: '/tools/psu?cpu=store:cpu-r7-9800x3d',
                compareHref: '/compare?ids=cpu-i5-12400f,cpu-r7-9800x3d',
              },
            ],
            gpus: [],
            notes: [VI_MESSAGES.tools.disclaimers.passmark],
          },
        },
        actions: {
          onRetryOptions: vi.fn(),
          onChangeCategory: vi.fn(),
          onSelectCurrent: vi.fn(),
          onChangeBudgetInput: vi.fn(),
          onSelectBudgetPreset: vi.fn(),
          onClearBudget: vi.fn(),
          onToggleSameSocket: vi.fn(),
          onToggleVendor: vi.fn(),
          onChangeSort: vi.fn(),
          onSubmit: vi.fn(),
          onAddToCart: vi.fn(),
        },
      }),
    );
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-current-summary"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-group-same-socket"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-group-platform-swap"');
    expect(upgradeCpuHtml).toContain('PATH // 01');
    expect(upgradeCpuHtml).toContain('PATH // 02');
    expect(upgradeCpuHtml).toContain('xl:grid-cols-3');
    expect(upgradeCpuHtml).toContain('bi-cpu');
    expect(upgradeCpuHtml).toContain('bi-gpu-card');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-uplift-cpu-i5-14600k"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-warning-cpu-r7-9800x3d-socket_change"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-add-cart-cpu-i5-14600k"');
    expect(upgradeCpuHtml).toContain('data-testid="upgrade-compare-link-cpu-i5-14600k"');
    expect(upgradeCpuHtml).not.toContain('<ul');
    expect(upgradeCpuHtml).not.toContain('<ol');

    const pppHtml = renderToStaticMarkup(
      createElement(PerfPerPriceView, {
        state: {
          category: 'cpu',
          availableVendors: ['intel', 'amd'],
          selectedVendors: [],
          maxPriceInput: '',
          budgetInputError: null,
          data: null,
          isLoading: false,
          errorMessage: null,
        },
        actions: {
          onChangeCategory: vi.fn(),
          onToggleVendor: vi.fn(),
          onChangeMaxPrice: vi.fn(),
          onSubmit: vi.fn(),
        },
      }),
    );
    expect(pppHtml).toContain('bi-cpu');
    expect(pppHtml).toContain('bi-gpu-card');
    expect(pppHtml).not.toContain('<ul');
    expect(pppHtml).not.toContain('<ol');

    const upgradeGpuHtml = renderToStaticMarkup(
      createElement(UpgradeAdvisorView, {
        state: {
          category: 'gpu',
          currentId: 'G13',
          budgetInput: '',
          budgetError: null,
          sameSocketOnly: false,
          sameSocketAvailable: false,
          availableVendors: ['nvidia', 'amd'],
          selectedVendors: [],
          sort: 'recommended',
          retailCpuOptions: [],
          legacyCpuOptions: [],
          retailGpuOptions: [],
          legacyGpuOptions: [],
          isLoadingOptions: false,
          optionsErrorMessage: null,
          isLoadingRecommendations: false,
          errorMessage: null,
          data: {
            category: 'gpu',
            current: {
              id: 'G13',
              retailProductId: null,
              category: 'gpu',
              source: 'legacy',
              name: 'NVIDIA RTX 3060',
              vendor: 'nvidia',
              socket: null,
              coresTotal: null,
              threadsTotal: null,
              psuPowerW: null,
              ramSupport: null,
              vramGb: 12,
              tbpW: 170,
              passmarkRaw: 17000,
              normalizedScore: null,
              hasPassmark: true,
            },
            hasSameSocketInCatalog: false,
            isTopTier: false,
            minUpgradePriceVnd: 8_990_000,
            sameSocketCpus: [],
            platformSwapCpus: [],
            gpus: [
              {
                id: 'gpu-zotac-rtx-5060',
                seriesId: 'gs-rtx-5060',
                seriesName: 'NVIDIA GeForce RTX 5060',
                name: 'ZOTAC RTX 5060 Solo',
                aibBrand: 'ZOTAC',
                vendor: 'nvidia',
                priceVnd: 8_990_000,
                imageUrl: null,
                vramGb: 8,
                tbpW: 145,
                lengthMm: 165,
                slotThickness: 2.0,
                variantCount: 5,
                score: { raw: 20581, normalized: 52.7 },
                perfPerPrice: 5.86,
                upliftPct: 21,
                warnings: [
                  { code: 'gpu_vram_decrease', severity: 'medium', fromVramGb: 12, toVramGb: 8 },
                ],
                psuHref: '/tools/psu?gpu=gs-rtx-5060',
                compareHref: null,
                aibVariantsHref: '/gpu?series=gs-rtx-5060',
              },
            ],
            notes: [VI_MESSAGES.tools.disclaimers.passmark],
          },
        },
        actions: {
          onRetryOptions: vi.fn(),
          onChangeCategory: vi.fn(),
          onSelectCurrent: vi.fn(),
          onChangeBudgetInput: vi.fn(),
          onSelectBudgetPreset: vi.fn(),
          onClearBudget: vi.fn(),
          onToggleSameSocket: vi.fn(),
          onToggleVendor: vi.fn(),
          onChangeSort: vi.fn(),
          onSubmit: vi.fn(),
          onAddToCart: vi.fn(),
        },
      }),
    );
    expect(upgradeGpuHtml).toContain('data-testid="upgrade-aib-variants-link-gs-rtx-5060"');
    expect(upgradeGpuHtml).not.toContain('<ul');
    expect(upgradeGpuHtml).not.toContain('<ol');
  });
});
