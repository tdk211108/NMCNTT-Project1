'use client';

import { LogIn, LogOut, ShieldAlert, ShoppingCart, User } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Card';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useCartStore } from '@/features/cart/store';
import { SearchBar } from '@/features/search/SearchBar';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { BrandMark } from './BrandMark';
import { GooeyNav, type GooeyNavItem } from './GooeyNav';
import { getChromeContainerClass } from './layout-width';
import { MusicPlayerBar } from './MusicPlayerBar';
import { ThemeToggle } from './ThemeToggle';
import { SfxToggle } from './UiSoundEffects';

type AuthSessionShape = ReturnType<typeof useAuthSession>;
type HeaderAuthState = Pick<AuthSessionShape['state'], 'user' | 'isLoggingOut'>;
type HeaderAuthActions = Pick<AuthSessionShape['actions'], 'openAuthModal' | 'logout'>;

function buildNavItems(isAdmin: boolean, compact = false): GooeyNavItem[] {
  const base: GooeyNavItem[] = [
    { href: '/cpu', label: VI_MESSAGES.nav.cpu },
    { href: '/gpu', label: VI_MESSAGES.nav.gpu },
    {
      href: '/tools',
      label: VI_MESSAGES.nav.tools,
      testId: compact ? TEST_IDS.header.floatingToolsDropdown : TEST_IDS.header.toolsDropdown,
      menuTestId: compact ? undefined : TEST_IDS.header.toolsMenu,
      subItems: [
        {
          href: '/compare',
          label: VI_MESSAGES.nav.compare,
          description: VI_MESSAGES.nav.compareMenuDesc,
          testId: compact ? undefined : TEST_IDS.header.toolsCompare,
        },
        {
          href: '/tools/combo',
          label: VI_MESSAGES.nav.combo,
          description: VI_MESSAGES.nav.comboMenuDesc,
          testId: compact ? undefined : TEST_IDS.header.toolsCombo,
        },
        {
          href: '/tools/upgrade',
          label: VI_MESSAGES.nav.upgrade,
          description: VI_MESSAGES.nav.upgradeMenuDesc,
          testId: compact ? undefined : TEST_IDS.header.toolsUpgrade,
        },
        {
          href: '/tools/psu',
          label: VI_MESSAGES.nav.psu,
          description: VI_MESSAGES.nav.psuMenuDesc,
          testId: compact ? undefined : TEST_IDS.header.toolsPsu,
        },
      ],
    },
    { href: '/tools/perf-per-price', label: VI_MESSAGES.nav.perfPerPrice },
  ];

  if (!isAdmin) {
    base.push({ href: '/orders/lookup', label: VI_MESSAGES.nav.orderLookup });
  }
  return base;
}

function PrimaryNavLinks({
  pathname,
  isAdmin,
  compact = false,
}: {
  pathname: string | null;
  isAdmin: boolean;
  compact?: boolean;
}) {
  const navItems = buildNavItems(isAdmin, compact);
  const currentPath = pathname ?? '/';
  const activeHref = currentPath.startsWith('/orders') ? '/orders/lookup' : currentPath;

  return (
    <nav aria-label={compact ? 'Điều hướng nhanh' : 'Điều hướng chính'} className="w-fit max-w-full">
      <GooeyNav items={navItems} activeHref={activeHref} size={compact ? 'sm' : 'md'} />
    </nav>
  );
}

function HeaderActions({
  totalCartCount,
  isAdmin,
  authState,
  authActions,
  floating = false,
}: {
  totalCartCount: number;
  isAdmin: boolean;
  authState: HeaderAuthState;
  authActions: HeaderAuthActions;
  floating?: boolean;
}) {
  const labelCollapseClass = floating ? 'hidden xl:inline' : 'hidden sm:inline';

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
      {!floating ? <MusicPlayerBar /> : null}

      {!floating ? <SfxToggle testId={TEST_IDS.header.sfxToggle} /> : null}

      <Link
        href="/cart"
        aria-label={VI_MESSAGES.nav.cart}
        data-testid={floating ? TEST_IDS.header.floatingCartLink : TEST_IDS.header.cartLink}
        className="mtx-shadow-sm inline-flex min-h-10 items-center gap-1.5 rounded-control border-2 border-border-strong bg-surface-subtle px-2 text-sm font-semibold text-ink hover:border-signal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-2.5"
      >
        <motion.span
          key={`cart-icon-${totalCartCount}`}
          initial={totalCartCount > 0 ? { rotate: -14, scale: 1.18 } : false}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 460, damping: 18 }}
          className="inline-flex items-center"
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
        </motion.span>
        <span className={labelCollapseClass}>{VI_MESSAGES.nav.cart}</span>
        <motion.span
          key={`cart-badge-${totalCartCount}`}
          initial={totalCartCount > 0 ? { scale: 1.28 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 460, damping: 20 }}
          data-testid={floating ? TEST_IDS.header.floatingCartCount : TEST_IDS.header.cartCount}
          className="rounded-control bg-primary px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums text-primary-fg"
        >
          {totalCartCount}
        </motion.span>
      </Link>

      <ThemeToggle
        testId={floating ? TEST_IDS.header.floatingThemeToggle : TEST_IDS.header.themeToggle}
      />

      {authState.user ? (
        isAdmin ? (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/admin"
              data-testid={floating ? undefined : TEST_IDS.header.adminToggle}
              className="mtx-shadow-sm inline-flex min-h-10 items-center gap-1.5 rounded-control border-2 border-signal bg-surface-subtle px-2.5 text-xs font-semibold text-ink sm:text-sm"
            >
              <ShieldAlert className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
              <Badge variant="accent">{VI_MESSAGES.nav.adminActiveBadge}</Badge>
              <span className={labelCollapseClass}>{VI_MESSAGES.nav.adminMode}</span>
            </Link>
            <button
              type="button"
              data-testid={floating ? undefined : TEST_IDS.auth.headerLogout}
              disabled={authState.isLoggingOut}
              onClick={() => void authActions.logout()}
              aria-label={VI_MESSAGES.nav.logout}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control border-2 border-border-strong bg-surface-subtle px-2.5 text-xs font-semibold text-ink-muted hover:border-signal hover:text-ink sm:text-sm"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className={labelCollapseClass}>{VI_MESSAGES.nav.logout}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Link
              href="/orders"
              data-testid={floating ? undefined : TEST_IDS.auth.headerMyOrders}
              className="mtx-shadow-sm inline-flex min-h-10 items-center gap-1.5 rounded-control border-2 border-border-strong bg-surface-subtle px-2.5 text-xs font-semibold text-ink hover:border-signal sm:text-sm"
            >
              {authState.user.avatarUrl ? (
                <img
                  src={authState.user.avatarUrl}
                  alt={authState.user.displayName}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span
                data-testid={floating ? undefined : TEST_IDS.auth.headerUserBadge}
                className="max-w-20 truncate sm:max-w-28"
              >
                {authState.user.displayName}
              </span>
            </Link>
            <button
              type="button"
              data-testid={floating ? undefined : TEST_IDS.auth.headerLogout}
              disabled={authState.isLoggingOut}
              onClick={() => void authActions.logout()}
              aria-label={VI_MESSAGES.nav.logout}
              className="inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control border-2 border-border-strong bg-surface-subtle px-2.5 text-xs font-semibold text-ink-muted hover:border-signal hover:text-ink sm:text-sm"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className={labelCollapseClass}>{VI_MESSAGES.nav.logout}</span>
            </button>
          </div>
        )
      ) : (
        <button
          type="button"
          data-testid={floating ? undefined : TEST_IDS.auth.headerLoginButton}
          onClick={() => authActions.openAuthModal({ tab: 'login' })}
          className="mtx-shadow-sm inline-flex min-h-10 cursor-pointer items-center gap-1 rounded-control border-2 border-border-strong bg-surface-subtle px-2 text-xs font-semibold text-ink hover:border-signal sm:gap-1.5 sm:px-3 sm:text-sm"
        >
          <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className={floating ? 'hidden lg:inline' : ''}>{VI_MESSAGES.nav.login}</span>
        </button>
      )}
    </div>
  );
}

interface FloatingNavBarProps {
  containerClass: string;
  pathname: string | null;
  isAdmin: boolean;
  totalCartCount: number;
  authState: HeaderAuthState;
  authActions: HeaderAuthActions;
}

/** Compact scrolled navigation bar grouping the 5 nav links beside the brand mark without SfxToggle. */
export function FloatingNavBar({
  containerClass,
  pathname,
  isAdmin,
  totalCartCount,
  authState,
  authActions,
}: FloatingNavBarProps) {
  return (
    <div
      role="region"
      aria-label="Điều hướng cố định"
      data-testid={TEST_IDS.header.floatingNav}
      className="mtx-floating-nav hidden border-b-2 border-border-strong bg-surface/95 backdrop-blur-sm md:fixed md:inset-x-0 md:top-0 md:z-40 md:block"
    >
      <div className={`${containerClass} flex min-h-14 items-center justify-between gap-3 py-1.5`}>
        <div className="flex min-w-0 items-center gap-3 lg:gap-5">
          <BrandMark size="compact" testId={TEST_IDS.header.floatingBrandLink} />
          <PrimaryNavLinks pathname={pathname} isAdmin={isAdmin} compact />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <SearchBar compactTrigger />
          <HeaderActions
            totalCartCount={totalCartCount}
            isAdmin={isAdmin}
            authState={authState}
            authActions={authActions}
            floating
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact 2-row Header:
 * - Row 1: BrandMark | Spotify-card Music Player + Cart + ThemeToggle + Auth
 * - Row 2: WebGL2 GooeyNav (stops cleanly after Order Lookup) | ExpandableSearch icon at row end
 */
export function Header() {
  const pathname = usePathname();
  const staticHeaderRef = useRef<HTMLElement>(null);
  const [showFloatingNav, setShowFloatingNav] = useState(false);

  const cartItems = useCartStore((s) => s.items);
  const cartHydrated = useCartStore((s) => s.hasHydrated);
  const { state: authState, actions: authActions } = useAuthSession();

  const isAdmin = authState.user?.role === 'admin';
  const totalCartCount = cartHydrated
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const containerClass = getChromeContainerClass();

  useEffect(() => {
    const target = staticHeaderRef.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const updateInitial = () => {
      setShowFloatingNav(target.getBoundingClientRect().bottom <= 0);
    };
    updateInitial();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setShowFloatingNav(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
      },
      { threshold: 0 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={staticHeaderRef}
        className="relative z-20 overflow-x-clip border-b-2 border-border-strong bg-surface"
      >
        <div className={`${containerClass} flex flex-col gap-2 py-2.5`}>
          <div className="relative z-30 flex flex-wrap items-center justify-between gap-2">
            <BrandMark testId={TEST_IDS.header.brandLink} />
            <HeaderActions
              totalCartCount={totalCartCount}
              isAdmin={isAdmin}
              authState={authState}
              authActions={authActions}
            />
          </div>

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2">
            <PrimaryNavLinks pathname={pathname} isAdmin={isAdmin} />
            <SearchBar />
          </div>
        </div>
      </header>

      {showFloatingNav ? (
        <FloatingNavBar
          containerClass={containerClass}
          pathname={pathname}
          isAdmin={isAdmin}
          totalCartCount={totalCartCount}
          authState={authState}
          authActions={authActions}
        />
      ) : null}
    </>
  );
}
