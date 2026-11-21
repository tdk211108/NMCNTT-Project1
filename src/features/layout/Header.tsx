'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Card';
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

  const isAdmin = authState.user?.role === 'admin';
  const totalCartCount = cartHydrated
    ? cartItems.reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-ink">
              {VI_MESSAGES.brand.name}
            </Link>
            <nav aria-label="Điều hướng chính" className="flex flex-wrap items-center gap-3 text-sm">
              <Link
                href="/cpu"
                className={pathname === '/cpu' ? 'font-semibold text-accent' : 'text-ink-muted hover:text-ink'}
              >
                {VI_MESSAGES.nav.cpu}
              </Link>
              <Link
                href="/gpu"
                className={pathname === '/gpu' ? 'font-semibold text-accent' : 'text-ink-muted hover:text-ink'}
              >
                {VI_MESSAGES.nav.gpu}
              </Link>
              <Link
                href="/compare"
                className={pathname === '/compare' ? 'font-semibold text-accent' : 'text-ink-muted hover:text-ink'}
              >
                {VI_MESSAGES.nav.compare}
              </Link>
              <Link
                href="/tools/perf-per-price"
                className={
                  pathname === '/tools/perf-per-price'
                    ? 'font-semibold text-accent'
                    : 'text-ink-muted hover:text-ink'
                }
              >
                {VI_MESSAGES.nav.perfPerPrice}
              </Link>
              <Link
                href="/tools/psu"
                className={pathname === '/tools/psu' ? 'font-semibold text-accent' : 'text-ink-muted hover:text-ink'}
              >
                {VI_MESSAGES.nav.psu}
              </Link>
              {!isAdmin ? (
                <Link
                  href="/orders/lookup"
                  className={
                    pathname?.startsWith('/orders')
                      ? 'font-semibold text-accent'
                      : 'text-ink-muted hover:text-ink'
                  }
                >
                  {VI_MESSAGES.nav.orderLookup}
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              data-testid={TEST_IDS.header.cartLink}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border bg-surface-subtle px-3 text-sm font-medium text-ink hover:border-border-strong"
            >
              <span>{VI_MESSAGES.nav.cart}</span>
              <span
                data-testid={TEST_IDS.header.cartCount}
                className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs font-semibold text-ink"
              >
                {totalCartCount}
              </span>
            </Link>

            {authState.user ? (
              isAdmin ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/admin"
                    data-testid={TEST_IDS.header.adminToggle}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-accent/60 bg-surface-subtle px-3 text-sm font-medium text-ink"
                  >
                    <Badge variant="accent">{VI_MESSAGES.nav.adminActiveBadge}</Badge>
                    <span>{VI_MESSAGES.nav.adminMode}</span>
                  </Link>
                  <button
                    type="button"
                    data-testid={TEST_IDS.auth.headerLogout}
                    disabled={authState.isLoggingOut}
                    onClick={() => void authActions.logout()}
                    className="min-h-9 rounded-control border border-border bg-surface-subtle px-3 text-sm text-ink-muted hover:text-ink"
                  >
                    {VI_MESSAGES.nav.logout}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/orders"
                    data-testid={TEST_IDS.auth.headerMyOrders}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border bg-surface-subtle px-3 text-sm font-medium text-ink hover:border-border-strong"
                  >
                    {authState.user.avatarUrl ? (
                      <img
                        src={authState.user.avatarUrl}
                        alt={authState.user.displayName}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : null}
                    <span data-testid={TEST_IDS.auth.headerUserBadge} className="max-w-28 truncate">
                      {authState.user.displayName}
                    </span>
                  </Link>
                  <button
                    type="button"
                    data-testid={TEST_IDS.auth.headerLogout}
                    disabled={authState.isLoggingOut}
                    onClick={() => void authActions.logout()}
                    className="min-h-9 rounded-control border border-border bg-surface-subtle px-3 text-sm text-ink-muted hover:text-ink"
                  >
                    {VI_MESSAGES.nav.logout}
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                data-testid={TEST_IDS.auth.headerLoginButton}
                onClick={() => authActions.openAuthModal({ tab: 'login' })}
                className="min-h-9 rounded-control border border-border bg-surface-subtle px-3 text-sm font-medium text-ink hover:border-border-strong"
              >
                {VI_MESSAGES.nav.login}
              </button>
            )}
          </div>
        </div>

        <SearchBar />
      </div>
    </header>
  );
}
