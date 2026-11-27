'use client';

import { Cpu, Home, Layers, ShieldAlert, User, Wrench, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { isOutsideDialogBackdropClick, useNativeDialog } from '@/lib/client-hooks';
import { useIsMobileViewport } from '@/lib/use-media-query';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { HARDWARE_TOOL_LINKS } from '../nav-items';

export { HARDWARE_TOOL_LINKS as MOBILE_TOOL_SHEET_ITEMS };

export function isMobileToolsRouteActive(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === '/compare' ||
    pathname.startsWith('/tools/combo') ||
    pathname.startsWith('/tools/upgrade') ||
    pathname.startsWith('/tools/psu')
  );
}

function shouldHideBottomNavForRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith('/products/') ||
    pathname === '/cart' ||
    pathname === '/checkout' ||
    pathname.startsWith('/checkout/')
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const isMobile = useIsMobileViewport();
  const { state: authState, actions: authActions } = useAuthSession();
  const [toolsOpen, setToolsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useNativeDialog(dialogRef, toolsOpen);

  if (!isMobile || shouldHideBottomNavForRoute(pathname)) {
    return null;
  }

  const currentPath = pathname ?? '/';
  const isToolsActive = isMobileToolsRouteActive(currentPath);
  const isAccountActive = currentPath === '/profile' || currentPath.startsWith('/admin');
  const isAdmin = authState.user?.role === 'admin';

  return (
    <>
      <nav
        aria-label={VI_MESSAGES.nav.mobileBottomNavAria}
        data-testid={TEST_IDS.header.mobileBottomNav}
        className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-border-strong bg-surface/98 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        <div className="grid grid-cols-5 items-stretch">
          <Link
            href="/"
            aria-current={currentPath === '/' ? 'page' : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
              currentPath === '/' ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Home className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{VI_MESSAGES.nav.home}</span>
          </Link>

          <Link
            href="/cpu"
            aria-current={currentPath.startsWith('/cpu') ? 'page' : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
              currentPath.startsWith('/cpu') ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Cpu className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{VI_MESSAGES.nav.cpu}</span>
          </Link>

          <Link
            href="/gpu"
            aria-current={currentPath.startsWith('/gpu') ? 'page' : undefined}
            className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
              currentPath.startsWith('/gpu') ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{VI_MESSAGES.nav.gpu}</span>
          </Link>

          <button
            type="button"
            data-sfx="toggle"
            aria-expanded={toolsOpen}
            onClick={() => setToolsOpen(true)}
            className={`flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
              isToolsActive || toolsOpen ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Wrench className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{VI_MESSAGES.nav.tools}</span>
          </button>

          {authState.user ? (
            <Link
              href={isAdmin ? '/admin' : '/profile'}
              aria-current={isAccountActive ? 'page' : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                isAccountActive ? 'text-accent-ink' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {isAdmin ? (
                <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <User className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">
                {isAdmin ? VI_MESSAGES.nav.adminMode : VI_MESSAGES.nav.mobileAccountLabel}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => authActions.openAuthModal({ tab: 'login' })}
              className="flex min-h-[56px] cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-[11px] font-semibold text-ink-muted transition-colors hover:text-ink"
            >
              <User className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="truncate">{VI_MESSAGES.nav.login}</span>
            </button>
          )}
        </div>
      </nav>

      {toolsOpen ? (
        <dialog
          ref={dialogRef}
          aria-label={VI_MESSAGES.nav.mobileToolsSheetTitle}
          data-testid={TEST_IDS.header.mobileToolsSheet}
          onClose={() => setToolsOpen(false)}
          onClick={(event) => {
            if (isOutsideDialogBackdropClick(event, dialogRef.current)) {
              setToolsOpen(false);
            }
          }}
          {...({ closedby: 'any' } as Record<string, string>)}
          className="mtx-shadow-accent m-auto mt-auto mb-0 w-full max-w-lg rounded-t-card border-2 border-b-0 border-border-strong bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] text-ink"
        >
          <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-border pb-2.5">
            <h2 className="font-display text-base font-bold text-ink uppercase">
              {VI_MESSAGES.nav.mobileToolsSheetTitle}
            </h2>
            <button
              type="button"
              autoFocus
              onClick={() => setToolsOpen(false)}
              aria-label={VI_MESSAGES.common.close}
              className="inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-subtle text-ink hover:border-signal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {HARDWARE_TOOL_LINKS.map((item) => {
              const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setToolsOpen(false)}
                  className={`flex min-h-13 items-start gap-3 rounded-control border-2 px-3 py-2.5 transition-colors ${
                    active
                      ? 'border-signal bg-highlight text-highlight-fg'
                      : 'border-border-strong bg-surface-subtle text-ink hover:border-signal'
                  }`}
                >
                  <item.Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-ink-muted">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </dialog>
      ) : null}
    </>
  );
}
