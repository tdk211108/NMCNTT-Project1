'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Card';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useCartStore } from '@/features/cart/store';
import { SearchBar } from '@/features/search/SearchBar';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function Header() {
  const pathname = usePathname();
  const cartItems = useCartStore((s) => s.items);
  const cartHydrated = useCartStore((s) => s.hasHydrated);
  const { state: authState, actions: authActions } = useAuthSession();

  const totalCartCount = cartHydrated
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  const isAdmin = authState.user?.role === 'admin';
  const navLinks = [
    { href: '/cpu', label: VI_MESSAGES.nav.cpu, active: pathname === '/cpu' },
    { href: '/gpu', label: VI_MESSAGES.nav.gpu, active: pathname === '/gpu' },
    { href: '/compare', label: VI_MESSAGES.nav.compare, active: pathname === '/compare' },
    {
      href: '/tools/perf-per-price',
      label: VI_MESSAGES.nav.perfPerPrice,
      active: pathname === '/tools/perf-per-price',
    },
    { href: '/tools/psu', label: VI_MESSAGES.nav.psu, active: pathname === '/tools/psu' },
    ...(!isAdmin
      ? [
          {
            href: '/orders/lookup',
            label: VI_MESSAGES.nav.orderLookup,
            active: Boolean(pathname?.startsWith('/orders')),
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-30">
      {/* Separate glass backdrop element avoids trapping SearchBar popover in a backdrop-filter root */}
      <div
        aria-hidden="true"
        className="aero-glass-elevated pointer-events-none absolute inset-0 -z-10 border-x-0 border-t-0"
      />

      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 min-[1120px]:flex-nowrap">
          <div className="flex flex-wrap items-center gap-2 min-[1120px]:flex-nowrap min-[1120px]:gap-2.5">
            <Link
              href="/"
              className="group inline-flex shrink-0 items-center gap-2 text-base font-bold tracking-tight text-ink sm:text-lg"
            >
              {/* Brand mark slot ready to be replaced with official logo asset */}
              <AeroIconBadge name="cpu-bold-duotone" size="sm" />
              <span>{VI_MESSAGES.brand.name}</span>
            </Link>

            <nav
              aria-label="Điều hướng chính"
              className="flex flex-wrap items-center gap-0.5 text-[13px] min-[1120px]:flex-nowrap"
            >
              {navLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-2 py-1.5 whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 ${
                    item.active
                      ? 'bg-accent/15 font-semibold text-primary shadow-[inset_0_1px_0_var(--aero-specular)]'
                      : 'text-ink-muted hover:bg-surface-subtle hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-[1120px]:shrink-0 min-[1120px]:flex-nowrap">
            <ThemeToggle />

            <Link
              href="/cart"
              data-testid={TEST_IDS.header.cartLink}
              className="aero-glass inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap text-ink transition-[transform,border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-elevated active:scale-95"
            >
              <SolarIcon name="cart-large-minimalistic-bold-duotone" className="h-4 w-4 text-primary" />
              <span>{VI_MESSAGES.nav.cart}</span>
              <span
                data-testid={TEST_IDS.header.cartCount}
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums text-primary-fg"
              >
                {totalCartCount}
              </span>
            </Link>

            {authState.user ? (
              authState.user.role === 'admin' ? (
                <div className="flex flex-wrap items-center gap-1.5 min-[1120px]:flex-nowrap">
                  <Link
                    href="/admin"
                    data-testid={TEST_IDS.header.adminToggle}
                    className="aero-glass inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border-border-strong px-2.5 text-[13px] font-semibold whitespace-nowrap text-ink transition-[transform,background-color] duration-150 hover:bg-surface-elevated active:scale-95"
                  >
                    <Badge variant="accent" className="px-1.5 py-0 text-[11px]">
                      {VI_MESSAGES.nav.adminActiveBadge}
                    </Badge>
                    <span>{VI_MESSAGES.nav.adminMode}</span>
                  </Link>
                  <button
                    type="button"
                    data-testid={TEST_IDS.auth.headerLogout}
                    disabled={authState.isLoggingOut}
                    onClick={() => void authActions.logout()}
                    className="aero-glass inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap text-ink-muted transition-[transform,color,background-color] duration-150 hover:bg-surface-elevated hover:text-ink active:scale-95"
                  >
                    <SolarIcon name="logout-2-bold-duotone" className="h-4 w-4" withShadow={false} />
                    <span>{VI_MESSAGES.nav.logout}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5 min-[1120px]:flex-nowrap">
                  <Link
                    href="/orders"
                    data-testid={TEST_IDS.auth.headerMyOrders}
                    className="aero-glass inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap text-ink transition-[transform,border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-elevated active:scale-95"
                  >
                    {authState.user.avatarUrl ? (
                      <img
                        src={authState.user.avatarUrl}
                        alt={authState.user.displayName}
                        className="h-5 w-5 rounded-full object-cover ring-1 ring-white/70"
                      />
                    ) : (
                      <SolarIcon name="user-bold-duotone" className="h-4 w-4 text-primary" />
                    )}
                    <span data-testid={TEST_IDS.auth.headerUserBadge} className="max-w-24 truncate">
                      {authState.user.displayName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    data-testid={TEST_IDS.auth.headerLogout}
                    disabled={authState.isLoggingOut}
                    onClick={() => void authActions.logout()}
                    className="aero-glass inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium whitespace-nowrap text-ink-muted transition-[transform,color,background-color] duration-150 hover:bg-surface-elevated hover:text-ink active:scale-95"
                  >
                    <SolarIcon name="logout-2-bold-duotone" className="h-4 w-4" withShadow={false} />
                    <span>{VI_MESSAGES.nav.logout}</span>
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                data-testid={TEST_IDS.auth.headerLoginButton}
                onClick={() => authActions.openAuthModal({ tab: 'login' })}
                className="aero-pill-cta inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[transform,filter] duration-150 hover:brightness-105 active:scale-95"
              >
                <SolarIcon name="login-2-bold-duotone" className="relative z-1 h-4 w-4" withShadow={false} />
                <span className="relative z-1">{VI_MESSAGES.nav.login}</span>
              </button>
            )}
          </div>
        </div>

        <SearchBar />
      </div>
    </header>
  );
}
