import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CartView } from '@/features/cart/components/CartView';
import { PaymentView } from '@/features/checkout/components/PaymentView';
import { ReviewModal } from '@/features/checkout/components/ReviewModal';
import { OrderBoardView } from '@/features/orders/components/OrderBoardView';
import { OrderStatusModal } from '@/features/orders/components/OrderStatusModal';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard } from '@/shared/types';

describe('Cart and Order UI views', () => {
  it('renders reworked OrderBoardView progress bar, stage-0 cancellation, and OrderStatusModal with preserved stage contracts', () => {
    const productName = 'AMD Ryzen 7 9800X3D';
    const unitPriceVnd = 13_490_000;
    const board: OrderBoard = {
      orderId: 'ORD-20261121-0001',
      stage: 2,
      isCompleted: false,
      isCancelled: false,
      cancelledAt: null,
      canCancel: false,
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

    const baseState = {
      orderId: board.orderId,
      board,
      isLoading: false,
      fetchError: null,
      needsLookup: false,
      lookupPhone: '',
      lookupError: null,
      isLookingUp: false,
      isAdvancing: false,
      isCancelling: false,
    };
    const baseActions = {
      onCopyOrderId: vi.fn(),
      onAdvanceStage: vi.fn(),
      onCancelOrder: vi.fn(),
      onChangeLookupPhone: vi.fn(),
      onSubmitLookup: vi.fn(),
    };

    const html = renderToStaticMarkup(
      createElement(OrderBoardView, {
        state: baseState,
        actions: baseActions,
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
    expect(html).not.toContain('data-testid="order-cancel-button"');

    const stage0Html = renderToStaticMarkup(
      createElement(OrderBoardView, {
        state: {
          ...baseState,
          board: {
            ...board,
            stage: 0,
            canCancel: true,
          },
        },
        actions: baseActions,
      }),
    );
    expect(stage0Html).toContain('data-testid="order-cancel-button"');
    expect(stage0Html).toContain('data-testid="order-demo-advance"');

    const cancelledHtml = renderToStaticMarkup(
      createElement(OrderBoardView, {
        state: {
          ...baseState,
          board: {
            ...board,
            stage: 0,
            isCancelled: true,
            cancelledAt: '2026-11-21T10:02:00Z',
            canCancel: false,
          },
        },
        actions: baseActions,
      }),
    );
    expect(cancelledHtml).toContain('data-testid="order-cancelled-message"');
    expect(cancelledHtml).toContain(VI_MESSAGES.orders.cancelledBanner);
    expect(cancelledHtml).not.toContain('data-testid="order-demo-advance"');
    expect(cancelledHtml).not.toContain('data-testid="order-cancel-button"');
    expect(cancelledHtml).not.toContain('opacity-60');

    const modalHtml = renderToStaticMarkup(
      createElement(OrderStatusModal, {
        placedOrder: {
          order: { ...board, stage: 0, canCancel: true },
          accessToken: 'tok-test',
        },
        isAdvancing: false,
        isCancelling: false,
        onCopyOrderId: vi.fn(),
        onAdvanceStage: vi.fn(),
        onCancelOrder: vi.fn(),
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
    expect(modalHtml).toContain('data-testid="order-cancel-button"');
    expect(modalHtml).toContain('data-testid="order-placed-continue-shopping"');
    expect(modalHtml).toContain('data-testid="order-placed-my-orders"');
    expect(modalHtml).toContain('data-testid="order-placed-close-view"');
    expect(modalHtml).toContain('src="/icons/order-thumb-test.png"');
    expect(modalHtml).not.toContain('<ul');
    expect(modalHtml).not.toContain('<ol');
  });

  it('renders subtotal and shipping fee breakdown in ReviewModal and PaymentView', () => {
    const basePrepared = {
      customer: {
        fullName: 'Nguyen Van A',
        phone: '0912345678',
        phoneMasked: '0912***678',
        provinceName: 'TP HCM',
        wardName: 'Phuong 1',
        streetAddress: '123 Duong ABC',
        note: null,
        addressLine: '123 Duong ABC, Phuong 1, TP HCM',
      },
      paymentMethod: 'card' as const,
      paymentReference: 'TT12345678',
      bankInstructions: null,
    };

    const oneItemAttempt = {
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
      request: {
        idempotencyKey: '11111111-1111-4111-8111-111111111111',
        items: [{ productId: 'cpu-1', quantity: 1 }],
        customer: {
          fullName: 'Nguyen Van A',
          phone: '0912345678',
          provinceCode: '79',
          wardCode: '26734',
          streetAddress: '123 Duong ABC',
        },
        paymentMethod: 'card' as const,
      },
      prepared: {
        ...basePrepared,
        quote: {
          lines: [
            {
              productId: 'cpu-1',
              name: 'AMD Ryzen 7 9800X3D',
              category: 'cpu' as const,
              imageUrl: null,
              unitPriceVnd: 14_390_000,
              quantity: 1,
              lineTotalVnd: 14_390_000,
              priceChange: null,
            },
          ],
          removed: [],
          totalQuantity: 1,
          subtotalVnd: 14_390_000,
          shippingFeeVnd: 50_000 as const,
          freeShipping: false,
          totalVnd: 14_440_000,
        },
      },
    };

    const reviewPaidShipHtml = renderToStaticMarkup(
      createElement(ReviewModal, {
        attempt: oneItemAttempt,
        countdown: 5,
        isSubmitting: false,
        onCancel: vi.fn(),
        onConfirmNow: vi.fn(),
      }),
    );
    expect(reviewPaidShipHtml).toContain('data-testid="review-subtotal"');
    expect(reviewPaidShipHtml).toContain('data-testid="review-shipping"');
    expect(reviewPaidShipHtml).toContain('data-testid="review-total"');
    expect(reviewPaidShipHtml).toContain('50.000');

    const reviewFreeShipHtml = renderToStaticMarkup(
      createElement(ReviewModal, {
        attempt: {
          ...oneItemAttempt,
          prepared: {
            ...oneItemAttempt.prepared,
            quote: {
              ...oneItemAttempt.prepared.quote,
              totalQuantity: 2,
              shippingFeeVnd: 0,
              freeShipping: true,
              totalVnd: 14_390_000,
            },
          },
        },
        countdown: 4,
        isSubmitting: false,
        onCancel: vi.fn(),
        onConfirmNow: vi.fn(),
      }),
    );
    expect(reviewFreeShipHtml).toContain(VI_MESSAGES.common.freeShippingLabel);

    const paymentHtml = renderToStaticMarkup(
      createElement(PaymentView, {
        state: {
          checkedStorage: true,
          isAuthLoading: false,
          isAuthenticated: true,
          attempt: oneItemAttempt,
          cardNumber: '',
          cardHolder: '',
          cardExpiry: '',
          cardCvv: '',
          isSubmitting: false,
          placedOrderModal: {
            placedOrder: null,
            hasCompletedOrder: false,
            isAdvancing: false,
            isCancelling: false,
          },
        },
        actions: {
          onChangeCardNumber: vi.fn(),
          onChangeCardHolder: vi.fn(),
          onChangeCardExpiry: vi.fn(),
          onChangeCardCvv: vi.fn(),
          onConfirmPayment: vi.fn(),
          onRequestLogin: vi.fn(),
          placedOrderActions: {
            openPlacedOrder: vi.fn(),
            onCopyOrderId: vi.fn(),
            onAdvanceStage: vi.fn(),
            onCancelOrder: vi.fn(),
            onContinueShopping: vi.fn(),
            onViewMyOrders: vi.fn(),
            onClose: vi.fn(),
          },
        },
      }),
    );
    expect(paymentHtml).toContain('data-testid="payment-subtotal"');
    expect(paymentHtml).toContain('data-testid="payment-shipping"');
    expect(paymentHtml).toContain('data-testid="payment-total"');
    expect(paymentHtml).toContain('50.000');
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

    const multiHardwareCartHtml = renderToStaticMarkup(
      createElement(CartView, {
        state: {
          ...cartBaseState,
          advisories: {
            items: [
              { code: 'multi_cpu_conflict' as const, severity: 'high' as const, sockets: ['AM5', 'LGA1700'], count: 2 },
              { code: 'multi_gpu_conflict' as const, severity: 'medium' as const, count: 2, distinctModels: 2 },
              { code: 'cpu_ram_platform' as const, severity: 'medium' as const, sockets: ['AM5'], ramKind: 'ddr5_only' as const },
              { code: 'cpu_ram_platform' as const, severity: 'info' as const, sockets: ['LGA1700'], ramKind: 'ddr4_and_ddr5' as const },
              { code: 'gpu_large_size' as const, severity: 'medium' as const, productName: 'ROG Astral RTX 5090', lengthMm: 358, slotThickness: 3.8 },
              { code: 'gpu_large_size' as const, severity: 'medium' as const, productName: 'MSI Trio RTX 5080', lengthMm: 338, slotThickness: 3.0 },
              {
                code: 'psu_recommendation' as const,
                severity: 'medium' as const,
                psuTierW: 1200,
                psuExactW: 1035,
                psuExceedsMaxTier: false,
                isMultiHardware: true,
                cpuName: 'Intel Core i9-14900K',
                gpuName: 'ROG Astral RTX 5090',
                actionKind: 'psu' as const,
                actionHref: '/tools/psu',
              },
            ],
            recommendedPsuTierW: 1200,
            recommendedPsuExactW: 1035,
            psuExceedsMaxTier: false,
          },
        },
        actions: cartActions,
      }),
    );
    expect(multiHardwareCartHtml).toContain('data-testid="cart-advisory-item-multi_gpu_conflict"');
    expect(multiHardwareCartHtml).toContain('ROG Astral RTX 5090');
    expect(multiHardwareCartHtml).toContain('MSI Trio RTX 5080');
    expect(multiHardwareCartHtml).toContain('AM5');
    expect(multiHardwareCartHtml).toContain('LGA1700');
    expect(multiHardwareCartHtml).toContain('Intel Core i9-14900K');
    expect(multiHardwareCartHtml).not.toContain('<ul');
    expect(multiHardwareCartHtml).not.toContain('<ol');
  });
});
