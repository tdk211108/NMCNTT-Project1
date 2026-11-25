import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { AnimatedCartButton } from '@/components/ui/AnimatedCartButton';
import { AnimatedCopyButton } from '@/components/ui/AnimatedCopyButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ComboboxSelect } from '@/components/ui/ComboboxSelect';
import { CartPlusIcon } from '@/components/ui/Icons';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { SpectrumLoader } from '@/components/ui/SpectrumLoader';
import { ToastContainer, ToastItemCard } from '@/components/ui/Toast';
import { DecryptedText } from '@/features/home/components/DecryptedText';
import {
  FocusPullCarousel,
  computeFocusPullStyle,
  computeLoopProgress,
  computeNextStaggeredTickMs,
  wrapCarouselIndex,
} from '@/features/home/components/FocusPullCarousel';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ProductCard as ProductCardDto } from '@/shared/types';

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

describe('UI primitives (icons, selectors, buttons, toasts, carousel, dialogs)', () => {
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

  it('renders DecryptedText, FocusPullCarousel geometry/markup, SpectrumLoader, Copy, Cart, AlertDialog, and Combobox', () => {
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
  });

  it('renders Toasts, Cyber/flat/demo Buttons, SearchableSelect error state, and Breadcrumb without <ul>/<ol>', () => {
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
  });
});
