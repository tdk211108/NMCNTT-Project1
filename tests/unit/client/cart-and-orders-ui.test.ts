import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CartView } from '@/features/cart/components/CartView';
import { OrderBoardView } from '@/features/orders/components/OrderBoardView';
import { OrderStatusModal } from '@/features/orders/components/OrderStatusModal';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard } from '@/shared/types';

describe('Cart and Order UI views', () => {
  it('renders reworked OrderBoardView progress bar and OrderStatusModal with preserved stage contracts', () => {
    const productName = 'AMD Ryzen 7 9800X3D';
    const unitPriceVnd = 13_490_000;
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
          productName,
          category: 'cpu',
          imageUrl: '/icons/order-thumb-test.png',
          unitPriceVnd,
          quantity: 1,
          lineTotalVnd: unitPriceVnd,
        },
      ],
      totalQuantity: 1,
      subtotalVnd: unitPriceVnd,
      shippingFeeVnd: 200_000,
      totalVnd: unitPriceVnd + 200_000,
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
    expect(html).toContain(`alt="${productName}"`);
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

  it('renders CartView advisories, opaque surfaces, tax note, word wrapping, and empty-cart redirect notice', () => {
    const cartBaseState = {
      hasHydrated: true,
      showEmptyNotice: false,
      isEmpty: false,
      lines: [
        {
          productId: 'cpu-amd-ryzen-7-9800x3d',
          name: 'AMD Ryzen 7 9800X3D',
          category: 'cpu' as const,
          imageUrl: null,
          unitPriceVnd: 14_390_000,
          quantity: 1,
          lineTotalVnd: 14_390_000,
          priceChange: null,
        },
      ],
      draftQtyById: {},
      subtotalVnd: 14_390_000,
      shippingFeeVnd: 50_000 as const,
      freeShipping: false,
      totalVnd: 14_440_000,
      totalQuantity: 1,
      advisories: {
        items: [
          {
            code: 'cpu_ram_platform' as const,
            severity: 'medium' as const,
            sockets: ['AM5'],
            ramKind: 'ddr5_only' as const,
          },
          {
            code: 'psu_recommendation' as const,
            severity: 'medium' as const,
            psuTierW: 850,
            psuExactW: 790,
            psuExceedsMaxTier: false,
            actionKind: 'psu' as const,
            actionHref: '/tools/psu?cpu=cpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5080',
          },
        ],
        recommendedPsuTierW: 850,
        recommendedPsuExactW: 790,
        psuExceedsMaxTier: false,
      },
      isAdvisoryDismissed: false,
      pendingRemoveId: null,
      isLoading: false,
      errorMessage: null,
    };
    const cartActions = {
      onDismissAdvisory: vi.fn(),
      onReopenAdvisory: vi.fn(),
      onIncrement: vi.fn(),
      onDecrement: vi.fn(),
      onQtyInputChange: vi.fn(),
      onQtyBlur: vi.fn(),
      onRequestRemove: vi.fn(),
      onConfirmRemove: vi.fn(),
      onCancelRemove: vi.fn(),
      onProceedToCheckout: vi.fn(),
    };

    const expandedCartHtml = renderToStaticMarkup(
      createElement(CartView, { state: cartBaseState, actions: cartActions }),
    );
    expect(expandedCartHtml).toContain('data-testid="cart-advisory-banner"');
    expect(expandedCartHtml).toContain(`${VI_MESSAGES.cart.advisories.heading} (2)`);
    expect(expandedCartHtml).not.toContain('Lưu ý kỹ thuật cho giỏ hàng');
    expect(expandedCartHtml).toContain('data-testid="cart-advisory-dismiss"');
    expect(expandedCartHtml).toContain('data-testid="cart-advisory-item-cpu_ram_platform"');
    expect(expandedCartHtml).toContain('data-testid="cart-advisory-item-psu_recommendation"');
    expect(expandedCartHtml).toContain('/tools/psu?cpu=cpu-amd-ryzen-7-9800x3d');
    expect(expandedCartHtml).not.toContain('<ul');
    expect(expandedCartHtml).not.toContain('<ol');

    // Long / unbroken product titles wrap cleanly inside minmax(0,1fr) without shifting quantity/remove controls.
    const longTitleCartHtml = renderToStaticMarkup(
      createElement(CartView, {
        state: {
          ...cartBaseState,
          lines: [
            {
              ...cartBaseState.lines[0],
              productId: 'gpu-unbreakable-test',
              name: 'SUPERLONGUNBREAKABLEMODELNAMEWITHOUTSPACES_RTX9090TI_32GB_GDDR7_EDITION',
            },
          ],
        },
        actions: cartActions,
      }),
    );
    expect(longTitleCartHtml).toContain('sm:grid-cols-[minmax(0,1fr)_auto]');
    expect(longTitleCartHtml).toContain('wrap-anywhere');
    expect(longTitleCartHtml).toContain('sm:shrink-0 sm:flex-nowrap sm:justify-self-end');
    expect(longTitleCartHtml).toContain('shrink-0 whitespace-nowrap');
    expect(longTitleCartHtml).toContain('data-testid="cart-tax-note"');
    expect(longTitleCartHtml).toContain('Ghi chú: Giá đã bao gồm thuế.');
    expect(longTitleCartHtml).toContain('bg-surface');
    expect(longTitleCartHtml).toContain('data-no-grid-cascade=""');

    const collapsedCartHtml = renderToStaticMarkup(
      createElement(CartView, {
        state: {
          ...cartBaseState,
          advisories: {
            ...cartBaseState.advisories,
            items: [
              { code: 'multi_cpu_conflict' as const, severity: 'high' as const, count: 2 },
              ...cartBaseState.advisories.items,
            ],
          },
          isAdvisoryDismissed: true,
        },
        actions: cartActions,
      }),
    );
    expect(collapsedCartHtml).not.toContain('data-testid="cart-advisory-banner"');
    expect(collapsedCartHtml).toContain('data-testid="cart-advisory-pill"');
    expect(collapsedCartHtml).toContain('data-testid="cart-advisory-reopen"');
    expect(collapsedCartHtml).toContain('bg-surface');
    expect(collapsedCartHtml).toContain('data-no-grid-cascade=""');
    expect(collapsedCartHtml).toContain('850 W');
    expect(collapsedCartHtml).not.toContain('<ul');
    expect(collapsedCartHtml).not.toContain('<ol');

    const redirectNoticeCartHtml = renderToStaticMarkup(
      createElement(CartView, {
        state: {
          ...cartBaseState,
          isEmpty: true,
          lines: [],
          showEmptyNotice: true,
        },
        actions: cartActions,
      }),
    );
    expect(redirectNoticeCartHtml).toContain('data-testid="cart-redirect-notice"');
    expect(redirectNoticeCartHtml).toContain(VI_MESSAGES.cart.emptyCartRedirectNotice);
    expect(redirectNoticeCartHtml).toContain('data-testid="cart-empty-notice"');
  });
});
