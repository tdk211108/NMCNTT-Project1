import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { formatDateTimeVi, formatExactWatts, formatNumberVi, formatVnd } from '@/lib/format';
import {
  DEFAULT_OPENGRAPH_IMAGES,
  buildPageMetadata,
  resolveSiteMetadataBase,
} from '@/lib/metadata';
import { matchesSearchTokens, normalizeSearchText } from '@/lib/search-filter';
import { createValidatedLocalPersistStorage, safeLocalStorage, safeSessionStorage } from '@/lib/safe-storage';
import {
  getLandingScrollInitScript,
  isReloadNavigationType,
  shouldResetLandingScroll,
} from '@/lib/landing-scroll';
import {
  DEFAULT_THEME_MODE,
  THEME_STORAGE_KEY,
  applyTheme,
  getThemeInitScript,
  parseStoredTheme,
} from '@/lib/theme';
import {
  DEFAULT_UI_SFX_ENABLED,
  UI_SFX_STORAGE_KEY,
  getUiSfxServerSnapshot,
  parseStoredUiSfx,
  playOrderDeliveredSfx,
  playUiSound,
  preloadOrderDeliveredSfx,
  readUiSfxEnabled,
  resetUiSfxCachesForTest,
  setUiSfxEnabled,
  shouldTriggerOrderDeliveredSfx,
  warmUiAudio,
} from '@/lib/ui-sound';
import { createOptimisticDeliveredBoard } from '@/features/orders/optimistic-board';
import { useCartStore } from '@/features/cart/store';
import { APPLE_PAY_SFX_PATH, BRAND_LOGO_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { cartStoredStateSchema } from '@/shared/schemas';

describe('client lib/format, lib/safe-storage and lib/api-client', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('formats VND, numbers, watts, and Asia/Ho_Chi_Minh datetimes', () => {
    expect(formatVnd(12_990_000)).toContain('12.990.000');
    expect(formatNumberVi(87.3, 1)).toBe('87,3');
    expect(formatExactWatts(581.25)).toBe('581,25 W');
    expect(formatExactWatts(450)).toBe('450 W');
    const formattedDt = formatDateTimeVi('2026-11-18T12:00:00Z');
    expect(formattedDt).toContain('19:00');
    expect(formattedDt).toMatch(/18\/11\/2026/);
    expect(formatDateTimeVi('invalid-date')).toBe('invalid-date');

    expect(normalizeSearchText('Đang bán — RTX 5070')).toBe('dang ban — rtx 5070');
    expect(matchesSearchTokens('asus 5070', ['ASUS PRIME RTX 5070 12GB', 'NVIDIA'])).toBe(true);
    expect(matchesSearchTokens('dang ban', ['Đang bán', 'AMD Ryzen 7'])).toBe(true);
    expect(matchesSearchTokens('msi 5090', ['ASUS PRIME RTX 5070 12GB', 'NVIDIA'])).toBe(false);
    expect(matchesSearchTokens('   ', ['anything'])).toBe(true);
  });

  it('provides memory fallback when browser storage is absent and resets invalid persisted JSON', () => {
    safeLocalStorage.setItem('k1', 'v1');
    expect(safeLocalStorage.getItem('k1')).toBe('v1');
    safeLocalStorage.removeItem('k1');
    expect(safeLocalStorage.getItem('k1')).toBeNull();

    safeSessionStorage.setItem('s1', 'v2');
    expect(safeSessionStorage.getItem('s1')).toBe('v2');
    safeSessionStorage.removeItem('s1');
    expect(safeSessionStorage.getItem('s1')).toBeNull();

    const cartPersist = createValidatedLocalPersistStorage(cartStoredStateSchema);
    safeLocalStorage.setItem('bad-json', '{corrupt');
    expect(cartPersist.getItem('bad-json')).toBeNull();

    safeLocalStorage.setItem(
      'bad-schema',
      JSON.stringify({ state: { items: [{ productId: 'BAD!ID', quantity: 999 }] }, version: 1 }),
    );
    expect(cartPersist.getItem('bad-schema')).toBeNull();
  });

  it('maps aborted or timed-out fetch requests to a 408 ApiClientError in Vietnamese', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new DOMException('The operation timed out', 'TimeoutError'));

    try {
      await expect(apiFetch('/api/psu/options')).rejects.toMatchObject({
        name: 'ApiClientError',
        code: 'INTERNAL',
        status: 408,
        message: VI_MESSAGES.common.requestTimeoutError,
      } satisfies Partial<ApiClientError>);

      const controller = new AbortController();
      fetchSpy.mockRejectedValueOnce(new DOMException('Aborted', 'AbortError'));
      await expect(
        apiFetch('/api/psu/options', { signal: controller.signal }),
      ).rejects.toMatchObject({
        name: 'AbortError',
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('client cart store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('enforces cart 20-item and 100-qty caps and applies server quote diffs', () => {
    const store = useCartStore.getState();
    for (let i = 1; i <= 20; i++) {
      expect(store.addItem({ productId: `cpu-${i}`, unitPriceVnd: 1_000_000 })).toBe(true);
    }
    expect(store.addItem({ productId: 'cpu-21', unitPriceVnd: 1_000_000 })).toBe(false);

    useCartStore.getState().setQuantity('cpu-1', 100);
    expect(useCartStore.getState().addItem({ productId: 'cpu-1', unitPriceVnd: 1_000_000 })).toBe(
      false,
    );

    useCartStore.getState().applyServerQuote({
      lines: [
        {
          productId: 'cpu-1',
          name: 'CPU 1',
          category: 'cpu',
          imageUrl: null,
          unitPriceVnd: 2_000_000,
          quantity: 100,
          lineTotalVnd: 200_000_000,
          priceChange: { fromVnd: 1_000_000, toVnd: 2_000_000 },
        },
      ],
      removed: [{ productId: 'cpu-2', name: 'CPU 2' }],
      totalQuantity: 100,
      subtotalVnd: 200_000_000,
      shippingFeeVnd: 0,
      freeShipping: true,
      totalVnd: 200_000_000,
    });

    const updatedItems = useCartStore.getState().items;
    expect(updatedItems.some((i) => i.productId === 'cpu-2')).toBe(false);
    expect(updatedItems.find((i) => i.productId === 'cpu-1')?.lastKnownUnitPriceVnd).toBe(
      2_000_000,
    );
  });

  it('builds consistent page metadata with OpenGraph defaults and optional noIndex', () => {
    const publicMeta = buildPageMetadata({
      title: 'Bộ vi xử lý (CPU)',
      description: 'Danh mục CPU chính hãng.',
    });
    expect(publicMeta.title).toBe('Bộ vi xử lý (CPU)');
    expect(publicMeta.openGraph).toMatchObject({
      type: 'website',
      locale: 'vi_VN',
      siteName: VI_MESSAGES.brand.name,
      title: 'Bộ vi xử lý (CPU) | CoreRaster',
      description: 'Danh mục CPU chính hãng.',
      images: DEFAULT_OPENGRAPH_IMAGES,
    });
    expect(DEFAULT_OPENGRAPH_IMAGES[0]).toMatchObject({
      url: BRAND_LOGO_PATH,
      width: 1200,
      height: 1200,
      alt: VI_MESSAGES.brand.name,
    });
    expect(publicMeta.robots).toBeUndefined();

    const privateMeta = buildPageMetadata({
      title: 'Giỏ hàng',
      noIndex: true,
    });
    expect(privateMeta.description).toBe(VI_MESSAGES.brand.tagline);
    expect(privateMeta.robots).toEqual({ index: false, follow: false });

    const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const prevProdUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const prevVercelUrl = process.env.VERCEL_URL;
    try {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
      delete process.env.VERCEL_URL;
      expect(resolveSiteMetadataBase().href).toBe('http://localhost:3000/');

      process.env.VERCEL_URL = 'coreraster-preview.vercel.app';
      expect(resolveSiteMetadataBase().href).toBe('https://coreraster-preview.vercel.app/');

      process.env.NEXT_PUBLIC_SITE_URL = 'https://shop.coreraster.vn';
      expect(resolveSiteMetadataBase().href).toBe('https://shop.coreraster.vn/');
    } finally {
      process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl;
      process.env.VERCEL_PROJECT_PRODUCTION_URL = prevProdUrl;
      process.env.VERCEL_URL = prevVercelUrl;
    }
  });

  it('parses, persists, and initializes dual-theme preferences cleanly with dark default', () => {
    expect(DEFAULT_THEME_MODE).toBe('dark');
    expect(parseStoredTheme('light')).toBe('light');
    expect(parseStoredTheme('dark')).toBe('dark');
    expect(parseStoredTheme('invalid')).toBe('dark');
    expect(parseStoredTheme(null)).toBe('dark');

    const metaAttrs = new Map<string, string>();
    const fakeMeta = {
      setAttribute: (k: string, v: string) => metaAttrs.set(k, v),
      getAttribute: (k: string) => metaAttrs.get(k) ?? null,
    };
    const fakeDoc = {
      documentElement: { dataset: {} as DOMStringMap },
      querySelector: (selector: string) =>
        selector === 'meta[name="color-scheme"]' ? fakeMeta : null,
    } as unknown as Document;
    const stored = new Map<string, string>();
    const fakeStorage = {
      setItem: (k: string, v: string) => stored.set(k, v),
    };

    applyTheme('light', { doc: fakeDoc, storage: fakeStorage });
    expect(metaAttrs.get('content')).toBe('light');
    expect(fakeDoc.documentElement.dataset.theme).toBe('light');
    expect(stored.get(THEME_STORAGE_KEY)).toBe('light');

    expect(getThemeInitScript()).toContain(THEME_STORAGE_KEY);
    expect(getThemeInitScript()).toContain('meta[name="color-scheme"]');
  });

  it('defaults UI click SFX to ON, persists toggle state, and safely no-ops without AudioContext', () => {
    expect(DEFAULT_UI_SFX_ENABLED).toBe(true);
    expect(getUiSfxServerSnapshot()).toBe(true);
    expect(parseStoredUiSfx(null)).toBe(true);
    expect(parseStoredUiSfx('on')).toBe(true);
    expect(parseStoredUiSfx('off')).toBe(false);
    expect(parseStoredUiSfx('false')).toBe(false);

    const backing = new Map<string, string>();
    const fakeStorage = {
      getItem: (k: string) => backing.get(k) ?? null,
      setItem: (k: string, v: string) => {
        backing.set(k, v);
      },
    };

    expect(readUiSfxEnabled(fakeStorage)).toBe(true);
    setUiSfxEnabled(false, { storage: fakeStorage });
    expect(backing.get(UI_SFX_STORAGE_KEY)).toBe('off');
    expect(readUiSfxEnabled(fakeStorage)).toBe(false);

    setUiSfxEnabled(true, { storage: fakeStorage });
    expect(backing.get(UI_SFX_STORAGE_KEY)).toBe('on');
    expect(readUiSfxEnabled(fakeStorage)).toBe(true);

    expect(() => warmUiAudio()).not.toThrow();
    expect(() => playUiSound('click', { force: true })).not.toThrow();
    expect(() => playUiSound('toggle', { force: true })).not.toThrow();
    expect(() => playUiSound('success', { force: true })).not.toThrow();
    expect(() => playUiSound('modal', { force: true })).not.toThrow();
  });

  it('triggers /applepay.mp3 delivery chime only on completion transitions and respects UI SFX state', async () => {
    expect(shouldTriggerOrderDeliveredSfx(0, { stage: 1, isCompleted: false })).toBe(false);
    expect(shouldTriggerOrderDeliveredSfx(2, { stage: 3, isCompleted: false })).toBe(false);
    expect(shouldTriggerOrderDeliveredSfx(3, { stage: 4, isCompleted: true })).toBe(true);
    expect(shouldTriggerOrderDeliveredSfx(2, { stage: 4, isCompleted: true })).toBe(true);
    expect(shouldTriggerOrderDeliveredSfx(4, { stage: 4, isCompleted: true })).toBe(false);

    resetUiSfxCachesForTest();
    try {
      await expect(playOrderDeliveredSfx({ force: true })).resolves.toBeUndefined();

      const disabledStorage = { getItem: () => 'off' };
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      await playOrderDeliveredSfx({ storage: disabledStorage });
      expect(fetchSpy).not.toHaveBeenCalled();

      const startMock = vi.fn();
      const setGainMock = vi.fn();
      const samples = new Float32Array(1000);
      samples[450] = 0.25;
      const decodeMock = vi.fn(async () => ({
        duration: 1.4,
        sampleRate: 10000,
        numberOfChannels: 1,
        length: samples.length,
        getChannelData: () => samples,
      }) as unknown as AudioBuffer);
      const fakeSource = {
        buffer: null as AudioBuffer | null,
        connect: vi.fn(),
        start: startMock,
      };
      const fakeGain = {
        gain: { setValueAtTime: setGainMock },
        connect: vi.fn(),
      };
      const createBufferMock = vi.fn(() => ({
        getChannelData: () => new Float32Array(16),
      }));

      class FakeAudioContext {
        state: AudioContextState = 'running';
        sampleRate = 44100;
        currentTime = 1.25;
        destination = {} as AudioDestinationNode;
        createBuffer = createBufferMock;
        createBufferSource = () => fakeSource as unknown as AudioBufferSourceNode;
        createGain = () => fakeGain as unknown as GainNode;
        decodeAudioData = decodeMock;
        resume = vi.fn(async () => {});
      }

      const audioFetchSpy = vi.fn(async () => ({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
      }));
      vi.stubGlobal('window', {
        AudioContext: FakeAudioContext,
      });
      vi.stubGlobal('fetch', audioFetchSpy);

      preloadOrderDeliveredSfx();
      await playOrderDeliveredSfx({ storage: { getItem: () => 'on' } });
      await playOrderDeliveredSfx({ storage: { getItem: () => 'on' } });
      expect(audioFetchSpy).toHaveBeenCalledTimes(1);
      expect(audioFetchSpy).toHaveBeenCalledWith(APPLE_PAY_SFX_PATH);
      expect(decodeMock).toHaveBeenCalledTimes(1);
      expect(startMock).toHaveBeenCalledTimes(2);
      // Skips leading silence (~45ms - 2ms safety margin = 0.043s) for instant chime transient.
      expect(startMock).toHaveBeenNthCalledWith(1, 0, expect.closeTo(0.043, 3));
      expect(startMock).toHaveBeenNthCalledWith(2, 0, expect.closeTo(0.043, 3));
      expect(setGainMock).toHaveBeenCalledWith(0.85, 1.25);

      const optimisticBoard = createOptimisticDeliveredBoard(
        {
          orderId: 'PC-TEST000001',
          stage: 3,
          isCompleted: false,
          isCancelled: false,
          cancelledAt: null,
          canCancel: false,
          stages: [
            { stage: 0, label: 'Đã đặt hàng', reachedAt: '2026-11-25T10:00:00.000Z' },
            { stage: 1, label: 'Đang chuẩn bị hàng', reachedAt: '2026-11-25T10:01:00.000Z' },
            { stage: 2, label: 'Đang vận chuyển', reachedAt: '2026-11-25T10:02:00.000Z' },
            { stage: 3, label: 'Đang giao hàng', reachedAt: '2026-11-25T10:03:00.000Z' },
            { stage: 4, label: 'Giao hàng thành công', reachedAt: null },
          ],
          customer: { fullName: 'Test User', phoneMasked: '090****123', addressLine: 'HCM', note: null },
          items: [],
          subtotalVnd: 1000000,
          shippingFeeVnd: 0,
          totalQuantity: 1,
          totalVnd: 1000000,
          paymentMethod: 'cod',
          paymentReference: 'TT123',
          createdAt: '2026-11-25T10:00:00.000Z',
        },
        '2026-11-25T10:04:00.000Z',
      );
      expect(optimisticBoard.stage).toBe(4);
      expect(optimisticBoard.isCompleted).toBe(true);
      expect(optimisticBoard.stages[4]?.reachedAt).toBe('2026-11-25T10:04:00.000Z');

      // Falls back to HTMLAudio when AudioContext is unavailable.
      resetUiSfxCachesForTest();
      const htmlPlayMock = vi.fn(async () => {});
      const htmlAudioCtorSpy = vi.fn();
      class FakeAudio {
        volume = 1;
        play = htmlPlayMock;
        constructor(src?: string) {
          htmlAudioCtorSpy(src);
        }
      }
      vi.stubGlobal('window', {});
      vi.stubGlobal('Audio', FakeAudio);
      await playOrderDeliveredSfx({ storage: { getItem: () => 'on' } });
      expect(htmlAudioCtorSpy).toHaveBeenCalledWith(APPLE_PAY_SFX_PATH);
      expect(htmlPlayMock).toHaveBeenCalledTimes(1);
    } finally {
      resetUiSfxCachesForTest();
      vi.unstubAllGlobals();
    }
  });

  it('dispatches all toast tones through react-hot-toast safely in Node', () => {
    expect(() => {
      showToast('Thông tin', 'info');
      showToast('Thành công', 'success');
      showToast('Cảnh báo', 'warning');
      showToast('Lỗi', 'error');
      toast.removeAll();
    }).not.toThrow();
  });

  it('resets scroll on landing reload/entry while preserving back_forward and catalog routes', () => {
    expect(isReloadNavigationType('reload')).toBe(true);
    expect(isReloadNavigationType('navigate')).toBe(false);
    expect(isReloadNavigationType(undefined)).toBe(false);

    expect(shouldResetLandingScroll('/', 'reload')).toBe(true);
    expect(shouldResetLandingScroll('/', 'navigate')).toBe(true);
    expect(shouldResetLandingScroll('/', 'back_forward')).toBe(false);
    expect(shouldResetLandingScroll('/cpu', 'reload')).toBe(false);
    expect(shouldResetLandingScroll('/gpu', 'reload')).toBe(false);

    const script = getLandingScrollInitScript();
    expect(script).toContain("window.location.pathname!=='/'");
    expect(script).toContain("window.history.scrollRestoration='manual'");
    expect(script).toContain('window.history.replaceState');
    expect(script).toContain('window.scrollTo(0,0)');
  });
});
