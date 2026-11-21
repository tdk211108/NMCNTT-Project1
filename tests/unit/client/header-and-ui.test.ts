import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import { CompareTableView } from '@/features/compare/components/CompareTableView';
import { HomeView } from '@/features/home/components/HomeView';
import { ZaloButton } from '@/features/layout/ZaloButton';
import { ProductDetailView } from '@/features/product-detail/components/ProductDetailView';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CompareResponse, ProductCard as ProductCardDto, ProductDetail } from '@/shared/types';

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

describe('UI polish and admin navigation rules', () => {
  beforeEach(() => {
    mockUseAuthSession.mockReset();
  });

  it('shows order lookup tab for guests/customers and hides it in admin mode', () => {
    mockUseAuthSession.mockReturnValue({
      state: { user: null, isLoggingOut: false },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const guestHtml = renderToStaticMarkup(createElement(Header));
    expect(guestHtml).toContain('href="/orders/lookup"');
    expect(guestHtml).toContain(VI_MESSAGES.nav.orderLookup);

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

  it('renders ZaloButton as a circular icon-only heartbeat bubble', () => {
    const html = renderToStaticMarkup(createElement(ZaloButton));
    expect(html).toContain('data-testid="zalo-float-button"');
    expect(html).toContain('zalo-heartbeat');
    expect(html).toContain('zalo-pulse-ring');
    expect(html).toContain('h-14 w-14');
    expect(html).toContain('rounded-full');
    expect(html).not.toContain('>Zalo<');
  });

  it('keeps compare top slot preview as thumbnail, enlarges criteria header image, and applies zoom frames only to non-thumbnails', () => {
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
    expect(cardHtml).toContain('bg-[#ED1C24]');
    expect(cardHtml).not.toContain('/ 100');

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
          onBuyNow: vi.fn(),
          onAddToCart: vi.fn(),
          onCompare: vi.fn(),
        },
      }),
    );
    expect(homeHtml).toContain('Raw Compute.');
    expect(homeHtml).toContain('Pure Raster.');
    expect(homeHtml).toContain('Uncompromising performance. Precision-engineered computing.');
    expect(homeHtml).toContain('CPU &amp; GPU RETAILER');
    expect(homeHtml).not.toContain('border-border-strong bg-surface p-6');
  });
});
