import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from '@/features/layout/components/Footer';
import { GooeyMenuChevron, GooeyNav } from '@/features/layout/components/GooeyNav';
import { InteractiveBackground } from '@/features/layout/components/InteractiveBackground';
import {
  DEFAULT_MUSIC_VOLUME,
  MusicPlayerBar,
  clampMusicVolume,
  readSavedMusicVolume,
} from '@/features/layout/components/MusicPlayerBar';
import {
  DEFAULT_IGNORE_CASCADE_SELECTOR,
  parseColorAlpha,
  shouldIgnoreGridCascade,
  type CascadeStyleSnapshot,
} from '@/features/layout/components/ShapeGrid';
import { ZaloButton } from '@/features/layout/components/ZaloButton';
import {
  MOBILE_TOOL_SHEET_ITEMS,
  isMobileToolsRouteActive,
} from '@/features/layout/components/MobileBottomNav';
import { MobileNavDrawer } from '@/features/layout/components/MobileNavDrawer';
import {
  CATALOG_CONTAINER_CLASS,
  CENTERED_CONTAINER_CLASS,
  WIDE_CONTAINER_CLASS,
  getChromeContainerClass,
  getMainContainerClass,
} from '@/features/layout/layout-width';
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import {
  BRAND_LOGO_MARK_LIGHT_PATH,
  BRAND_LOGO_MARK_PATH,
  MUSIC_PLAYER_ICON_PATH,
} from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';

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

vi.mock('@/features/search/components/SearchBar', () => ({
  SearchBar: () => null,
}));

const { Header, FloatingNavBar } = await import('@/features/layout/components/Header');

describe('Layout chrome, navigation, support dock, music bar, and policy shell', () => {
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
    expect(customerHtml).toContain('href="/profile"');
    expect(customerHtml).toContain('data-testid="auth-header-profile"');

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

  it('renders Header SFX toggle, brand marks, FloatingNavBar, Footer, and PolicyLayout without <ul>/<ol>', () => {
    mockUseAuthSession.mockReturnValue({
      state: { user: null, isLoggingOut: false },
      actions: { openAuthModal: vi.fn(), logout: vi.fn() },
    });
    const headerHtml = renderToStaticMarkup(createElement(Header));
    expect(headerHtml).toContain('data-testid="header-brand-link"');
    expect(headerHtml).toContain('mtx-brand-dark-mark');
    expect(headerHtml).toContain('mtx-brand-light-mark');
    expect(headerHtml).not.toContain('bg-[#17181C]');
    expect(headerHtml).toContain(`src="${BRAND_LOGO_MARK_PATH}"`);
    expect(headerHtml).toContain(`src="${BRAND_LOGO_MARK_LIGHT_PATH}"`);
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
    expect(floatingHtml).toContain('data-testid="header-floating-brand-link"');
    expect(floatingHtml).toContain(`src="${BRAND_LOGO_MARK_PATH}"`);
    expect(floatingHtml).toContain(`src="${BRAND_LOGO_MARK_LIGHT_PATH}"`);
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

    const footerHtml = renderToStaticMarkup(createElement(Footer));
    expect(footerHtml).toContain('data-testid="footer-brand-link"');
    expect(footerHtml).toContain(`src="${BRAND_LOGO_MARK_PATH}"`);
    expect(footerHtml).toContain(`src="${BRAND_LOGO_MARK_LIGHT_PATH}"`);
    expect(footerHtml).toContain(VI_MESSAGES.brand.name);
    expect(footerHtml).toContain('data-testid="footer-github-button"');
    expect(footerHtml).not.toContain('<ul');
    expect(footerHtml).not.toContain('<ol');

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
  });

  it('renders GooeyNav, GooeyMenuChevron, and MusicPlayerBar with safe volume helpers', () => {
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

    const closedChevronHtml = renderToStaticMarkup(createElement(GooeyMenuChevron, { open: false }));
    expect(closedChevronHtml).toContain('lucide-chevron-down');
    expect(closedChevronHtml).not.toContain('rotate-180');

    const openChevronHtml = renderToStaticMarkup(createElement(GooeyMenuChevron, { open: true }));
    expect(openChevronHtml).toContain('lucide-chevron-down');
    expect(openChevronHtml).toContain('motion-safe:transition-transform');
    expect(openChevronHtml).toContain('rotate-180');

    const toolsGooeyHtml = renderToStaticMarkup(
      createElement(GooeyNav, {
        items: [
          { href: '/cpu', label: 'CPU' },
          {
            href: '/tools',
            label: VI_MESSAGES.nav.tools,
            testId: 'header-tools-dropdown',
            subItems: [
              { href: '/compare', label: VI_MESSAGES.nav.compare, description: 'So sánh' },
            ],
          },
        ],
        activeHref: '/compare',
      }),
    );
    expect((toolsGooeyHtml.match(/lucide-chevron-down/g) ?? []).length).toBe(2);
    expect(toolsGooeyHtml).not.toContain('rotate-180');

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
    expect(playerHtml).toContain(`src="${MUSIC_PLAYER_ICON_PATH}"`);
  });

  it('renders collapsible support dock, ShapeGrid InteractiveBackground, and route layout widths', () => {
    const html = renderToStaticMarkup(createElement(ZaloButton));
    expect(html).toContain('data-testid="support-float-dock"');
    expect(html).toContain('data-no-grid-cascade');
    expect(html).toContain('data-testid="facebook-float-button"');
    expect(html).toContain('href="https://www.facebook.com/tdk1108/"');
    expect(html).toContain('src="/fb.svg"');
    expect(html).toContain('data-testid="zalo-float-button"');
    expect(html).toContain('src="/zalo.svg"');
    expect(html).toContain('data-testid="support-collapse-toggle"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('zalo-heartbeat');
    expect(html).toContain('zalo-pulse-ring');
    expect(html).toContain('zalo-pulse-ring-delay');
    expect(html).toContain('bottom-20');
    expect(html).toContain('md:h-14 md:w-14');
    expect(html).toContain('rounded-full');
    expect(html).toContain('md:rounded-[14px]');
    expect(html).not.toContain('>Zalo<');
    expect(html).not.toContain('<ul');
    expect(html).not.toContain('<ol');

    const drawerHtml = renderToStaticMarkup(
      createElement(MobileNavDrawer, {
        id: 'mobile-drawer-test',
        open: false,
        pathname: '/',
        isAdmin: false,
        totalCartCount: 3,
        authState: { user: null, isLoggingOut: false },
        authActions: { openAuthModal: vi.fn(), logout: vi.fn() },
        onClose: vi.fn(),
      }),
    );
    expect(drawerHtml).toContain('<dialog');
    expect(drawerHtml).toContain('data-testid="header-mobile-drawer"');
    expect(drawerHtml).toContain('data-testid="header-music-bar"');
    expect(drawerHtml).toContain('data-testid="header-theme-toggle"');
    expect(drawerHtml).toContain('data-testid="header-sfx-toggle"');
    expect(drawerHtml).toContain('href="/compare"');
    expect(drawerHtml).not.toContain('<ul');
    expect(drawerHtml).not.toContain('<ol');

    const oauthDrawerHtml = renderToStaticMarkup(
      createElement(MobileNavDrawer, {
        id: 'mobile-drawer-oauth',
        open: false,
        pathname: '/profile',
        isAdmin: false,
        totalCartCount: 0,
        authState: {
          user: {
            id: 'u-oauth',
            role: 'customer',
            username: null,
            displayName: 'Google User',
            avatarUrl: null,
            provider: 'google',
          },
          isLoggingOut: false,
        },
        authActions: { openAuthModal: vi.fn(), logout: vi.fn() },
        onClose: vi.fn(),
      }),
    );
    expect(oauthDrawerHtml).not.toContain('@null');
    expect(oauthDrawerHtml).toContain(VI_MESSAGES.profile.oauthUsernameFallback);

    const toolHrefs: string[] = MOBILE_TOOL_SHEET_ITEMS.map((item) => item.href);
    expect(toolHrefs).toEqual(['/compare', '/tools/combo', '/tools/upgrade', '/tools/psu']);
    expect(toolHrefs).not.toContain('/tools/perf-per-price');
    expect(isMobileToolsRouteActive('/tools/perf-per-price')).toBe(false);
    expect(isMobileToolsRouteActive('/compare')).toBe(true);
    expect(isMobileToolsRouteActive('/tools/combo')).toBe(true);
    expect(isMobileToolsRouteActive('/tools/upgrade')).toBe(true);
    expect(isMobileToolsRouteActive('/tools/psu')).toBe(true);

    const bgHtml = renderToStaticMarkup(createElement(InteractiveBackground));
    expect(bgHtml).toContain('data-testid="layout-interactive-bg"');
    expect(bgHtml).toContain('aria-hidden="true"');
    expect(bgHtml).toContain('fixed inset-0 z-0');
    expect(bgHtml).toContain('data-theme-variant="dark"');
    expect(bgHtml).toContain('<canvas');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('header');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('nav');
    expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain('header-floating-nav');

    expect(WIDE_CONTAINER_CLASS).toContain('max-w-[1440px]');
    expect(CATALOG_CONTAINER_CLASS).toContain('max-w-[1760px]');

    expect(getMainContainerClass('/')).toBe('w-full flex-1 pb-6');
    expect(getMainContainerClass('/cpu')).toContain('max-w-[1760px]');
    expect(getMainContainerClass('/gpu')).toContain('max-w-[1760px]');
    expect(getMainContainerClass('/tools/perf-per-price')).toContain('max-w-[1760px]');
    expect(getMainContainerClass('/checkout')).toContain(CENTERED_CONTAINER_CLASS);

    expect(getChromeContainerClass()).toBe(WIDE_CONTAINER_CLASS);
  });

  it('ignores click cascade inside controls, cells, and visually boxed containers while keeping empty canvas interactive', () => {
    for (const token of [
      'aside',
      'table',
      'td',
      'th',
      'button',
      'a[href]',
      'input',
      'select',
      'label',
      '[role="tab"]',
      '[data-no-grid-cascade]',
    ]) {
      expect(DEFAULT_IGNORE_CASCADE_SELECTOR).toContain(token);
    }

    expect(parseColorAlpha(null)).toBe(0);
    expect(parseColorAlpha('')).toBe(0);
    expect(parseColorAlpha('transparent')).toBe(0);
    expect(parseColorAlpha('rgba(0, 0, 0, 0)')).toBe(0);
    expect(parseColorAlpha('rgb(0 0 0 / 0)')).toBe(0);
    expect(parseColorAlpha('rgb(0 0 0 / 0%)')).toBe(0);
    expect(parseColorAlpha('oklab(0.5 0.1 0.1 / none)')).toBe(0);
    expect(parseColorAlpha('rgba(200, 16, 46, 0.15)')).toBe(0.15);
    expect(parseColorAlpha('oklab(0.5 0.1 0.1 / 25%)')).toBe(0.25);
    expect(parseColorAlpha('rgb(24, 26, 31)')).toBe(1);

    const TRANSPARENT_STYLE: CascadeStyleSnapshot = {
      backgroundColor: 'rgba(0, 0, 0, 0)',
      backgroundImage: 'none',
      boxShadow: 'none',
      backdropFilter: 'none',
      borderTopWidth: '0px',
      borderTopStyle: 'none',
      borderTopColor: 'rgb(0, 0, 0)',
      borderRightWidth: '0px',
      borderRightStyle: 'none',
      borderRightColor: 'rgb(0, 0, 0)',
      borderBottomWidth: '0px',
      borderBottomStyle: 'none',
      borderBottomColor: 'rgb(0, 0, 0)',
      borderLeftWidth: '0px',
      borderLeftStyle: 'none',
      borderLeftColor: 'rgb(0, 0, 0)',
    };

    type StubEl = {
      style: CascadeStyleSnapshot;
      matched?: boolean;
      parentElement: StubEl | null;
      closest: (selector: string) => StubEl | null;
    };

    const makeEl = (
      overrides: Partial<CascadeStyleSnapshot> = {},
      parentElement: StubEl | null = null,
      matched = false,
    ): StubEl => {
      const node: StubEl = {
        style: { ...TRANSPARENT_STYLE, ...overrides },
        matched,
        parentElement,
        closest: () => {
          for (let cur: StubEl | null = node; cur; cur = cur.parentElement) {
            if (cur.matched) return cur;
          }
          return null;
        },
      };
      return node;
    };

    const readStyle = (el: unknown) => (el as StubEl).style;

    // Empty layout wrapper + single-sided border-l-4 header allow open canvas ripples
    const mainWrap = makeEl();
    const borderLeftHeader = makeEl(
      { borderLeftWidth: '4px', borderLeftStyle: 'solid', borderLeftColor: 'rgb(200, 16, 46)' },
      mainWrap,
    );
    expect(
      shouldIgnoreGridCascade(
        borderLeftHeader as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(false);

    // Interactive/control selector match ignores immediately
    const buttonInsideMain = makeEl({}, mainWrap, true);
    expect(
      shouldIgnoreGridCascade(
        buttonInsideMain as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    // Child inside Card / filled stat tile / translucent surface / gradient / shadow / backdrop / 4-sided border ignores
    const cardRoot = makeEl({ backgroundColor: 'rgb(24, 26, 31)' }, mainWrap);
    const childParagraph = makeEl({}, cardRoot);
    expect(
      shouldIgnoreGridCascade(
        childParagraph as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    const tintedTile = makeEl({ backgroundColor: 'oklab(0.51 0.19 0.09 / 0.15)' }, mainWrap);
    expect(
      shouldIgnoreGridCascade(
        tintedTile as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    const borderedBox = makeEl(
      {
        borderTopWidth: '2px',
        borderTopStyle: 'solid',
        borderTopColor: 'rgb(142, 147, 155)',
        borderRightWidth: '2px',
        borderRightStyle: 'solid',
        borderRightColor: 'rgb(142, 147, 155)',
        borderBottomWidth: '2px',
        borderBottomStyle: 'solid',
        borderBottomColor: 'rgb(142, 147, 155)',
        borderLeftWidth: '2px',
        borderLeftStyle: 'solid',
        borderLeftColor: 'rgb(142, 147, 155)',
      },
      mainWrap,
    );
    expect(
      shouldIgnoreGridCascade(
        borderedBox as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    const shadowBox = makeEl({ boxShadow: '4px 4px 0px 0px rgb(0, 0, 0)' }, mainWrap);
    expect(
      shouldIgnoreGridCascade(
        shadowBox as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    const gradientBox = makeEl({ backgroundImage: 'linear-gradient(#000, #111)' }, mainWrap);
    expect(
      shouldIgnoreGridCascade(
        gradientBox as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    const glassBox = makeEl({ backdropFilter: 'blur(4px)' }, mainWrap);
    expect(
      shouldIgnoreGridCascade(
        glassBox as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);

    // Non-Element node resolves to parentElement cleanly; empty selector or null target opts out
    const textNodeTarget = { parentElement: cardRoot };
    expect(
      shouldIgnoreGridCascade(
        textNodeTarget as unknown as EventTarget,
        DEFAULT_IGNORE_CASCADE_SELECTOR,
        readStyle,
      ),
    ).toBe(true);
    expect(shouldIgnoreGridCascade(cardRoot as unknown as EventTarget, '', readStyle)).toBe(false);
    expect(shouldIgnoreGridCascade(null, DEFAULT_IGNORE_CASCADE_SELECTOR, readStyle)).toBe(false);
  });
});
