'use client';

import {
  BookOpen,
  Cpu,
  Home,
  Layers,
  LogIn,
  LogOut,
  PackageSearch,
  ShieldAlert,
  ShoppingCart,
  Trophy,
  User,
  X,
} from 'lucide-react';
import { HARDWARE_TOOL_LINKS, POLICY_LINKS } from '../nav-items';
import Link from 'next/link';
import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Badge } from '@/components/ui/Card';
import { getProfileInitials } from '@/lib/format';
import type { useAuthSession } from '@/features/auth/useAuthSession';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { BrandMark } from './BrandMark';
import { MusicPlayerBar } from './MusicPlayerBar';
import { ThemeToggle } from './ThemeToggle';
import { SfxToggle } from './UiSoundEffects';

type AuthSessionShape = ReturnType<typeof useAuthSession>;

export interface MobileNavDrawerProps {
  id: string;
  open: boolean;
  pathname: string | null;
  isAdmin: boolean;
  totalCartCount: number;
  authState: Pick<AuthSessionShape['state'], 'user' | 'isLoggingOut'>;
  authActions: Pick<AuthSessionShape['actions'], 'openAuthModal' | 'logout'>;
  onClose: () => void;
}



export function MobileNavDrawer({
  id,
  open,
  pathname,
  isAdmin,
  totalCartCount,
  authState,
  authActions,
  onClose,
}: MobileNavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const closeFallbackTimerRef = useRef<number | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function finishClose() {
    if (closeFallbackTimerRef.current !== null) {
      window.clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    onCloseRef.current();
  }

  function requestAnimatedClose() {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    if (!dialog?.open) {
      onCloseRef.current();
      return;
    }
    if (
      !scroller ||
      scroller.offsetWidth <= 0 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finishClose();
      return;
    }
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
    if (closeFallbackTimerRef.current !== null) {
      window.clearTimeout(closeFallbackTimerRef.current);
    }
    closeFallbackTimerRef.current = window.setTimeout(() => {
      finishClose();
    }, 340);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!dialog || !scroller || !sheet) return undefined;

    let cancelled = false;

    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      const openFrame = async () => {
        if (
          typeof CSS !== 'undefined' &&
          typeof CSS.supports === 'function' &&
          !CSS.supports('scroll-initial-target', 'nearest')
        ) {
          scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'instant' });
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
        }
        if (!cancelled) {
          scroller.scrollTo({ left: 0, behavior: 'auto' });
        }
      };
      void openFrame();
    } else if (dialog.open) {
      dialog.close();
    }

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!open || !dialog || !scroller || !sheet) return undefined;

    let removeScrollFallback: (() => void) | undefined;
    if (
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      !CSS.supports('animation-timeline: scroll()')
    ) {
      const syncBackdrop = () => {
        const width = sheet.offsetWidth || 1;
        const ratio = Math.min(1, Math.max(0, 1 - scroller.scrollLeft / width));
        dialog.style.setProperty('--drawer-backdrop', String(ratio));
      };
      syncBackdrop();
      scroller.addEventListener('scroll', syncBackdrop, { passive: true });
      removeScrollFallback = () => scroller.removeEventListener('scroll', syncBackdrop);
    }

    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      const visibleThreshold = 1 / Math.max(1, window.innerWidth);
      let hasEntered = false;
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries.at(-1);
          if (!entry) return;
          if (entry.intersectionRatio >= visibleThreshold) {
            hasEntered = true;
          } else if (hasEntered) {
            finishClose();
          }
        },
        { root: dialog, threshold: [visibleThreshold, 1] },
      );
      observer.observe(sheet);
    }

    return () => {
      removeScrollFallback?.();
      observer?.disconnect();
      if (closeFallbackTimerRef.current !== null) {
        window.clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
    };
  }, [open]);

  const currentPath = pathname ?? '/';
  const storeItems = [
    { href: '/', label: VI_MESSAGES.nav.home, Icon: Home },
    { href: '/cpu', label: VI_MESSAGES.nav.cpu, Icon: Cpu },
    { href: '/gpu', label: VI_MESSAGES.nav.gpu, Icon: Layers },
    { href: '/tools/perf-per-price', label: VI_MESSAGES.nav.perfPerPrice, Icon: Trophy },
    ...(isAdmin ? [] : [{ href: '/orders/lookup', label: VI_MESSAGES.nav.orderLookup, Icon: PackageSearch }]),
  ];



  function handleBackdropClick(event: ReactMouseEvent<HTMLDialogElement>) {
    if (!sheetRef.current) return;
    if (!sheetRef.current.contains(event.target as Node)) {
      requestAnimatedClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      aria-label={VI_MESSAGES.nav.mobileMenuTitle}
      data-testid={TEST_IDS.header.mobileDrawer}
      onCancel={(event) => {
        if (event.cancelable) {
          event.preventDefault();
          requestAnimatedClose();
        }
      }}
      onClose={() => onCloseRef.current()}
      onClick={handleBackdropClick}
      className="mtx-drawer"
    >
      <div ref={scrollerRef} className="mtx-drawer-scroller">
        <nav
          ref={sheetRef}
          aria-label={VI_MESSAGES.nav.mobileMenuTitle}
          className="mtx-drawer-sheet flex flex-col gap-5 border-r-2 border-border-strong bg-surface p-4 text-ink shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-border pb-3">
            <BrandMark size="sm" />
            <button
              type="button"
              autoFocus
              onClick={requestAnimatedClose}
              aria-label={VI_MESSAGES.nav.mobileMenuCloseAria}
              data-testid={TEST_IDS.header.mobileDrawerClose}
              className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-subtle text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Account Card */}
          <div className="rounded-card border-2 border-border-strong bg-surface-subtle p-3">
            {authState.user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border-strong bg-surface-elevated">
                    {authState.user.avatarUrl ? (
                      <img
                        src={authState.user.avatarUrl}
                        alt={authState.user.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="font-display text-sm font-bold text-ink">
                        {getProfileInitials(authState.user.displayName)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {authState.user.displayName}
                    </p>
                    <p className="truncate font-mono text-xs text-ink-muted">
                      {isAdmin
                        ? VI_MESSAGES.nav.adminMode
                        : authState.user.username
                          ? `@${authState.user.username}`
                          : VI_MESSAGES.profile.oauthUsernameFallback}
                    </p>
                  </div>
                  {isAdmin ? <Badge variant="accent">{VI_MESSAGES.nav.adminActiveBadge}</Badge> : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={isAdmin ? '/admin' : '/profile'}
                    onClick={finishClose}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-control border-2 border-border-strong bg-surface px-2.5 text-xs font-semibold text-ink hover:border-signal"
                  >
                    {isAdmin ? (
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
                    ) : (
                      <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{isAdmin ? VI_MESSAGES.nav.adminMode : VI_MESSAGES.profile.pageTitle}</span>
                  </Link>
                  <button
                    type="button"
                    disabled={authState.isLoggingOut}
                    data-testid={TEST_IDS.auth.headerLogout}
                    onClick={() => {
                      finishClose();
                      void authActions.logout();
                    }}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-control border-2 border-border-strong bg-surface px-2.5 text-xs font-semibold text-ink-muted hover:border-signal hover:text-ink"
                  >
                    <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{VI_MESSAGES.nav.logout}</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  finishClose();
                  authActions.openAuthModal({ tab: 'login' });
                }}
                className="mtx-shadow-sm inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control border-2 border-border-strong bg-primary px-3 text-sm font-bold text-primary-fg hover:bg-[var(--color-primary-hover)]"
              >
                <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{VI_MESSAGES.nav.login}</span>
              </button>
            )}
          </div>

          {/* Store Navigation */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-bold tracking-widest text-accent-ink uppercase">
              {VI_MESSAGES.nav.mobileStoreSection}
            </p>
            <div className="flex flex-col gap-1.5">
              {storeItems.map((item) => {
                const active =
                  item.href === '/'
                    ? currentPath === '/'
                    : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={finishClose}
                    className={`flex min-h-11 items-center gap-3 rounded-control border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-signal bg-primary text-primary-fg'
                        : 'border-border bg-surface-subtle text-ink hover:border-signal'
                    }`}
                  >
                    <item.Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/cart"
                aria-current={currentPath === '/cart' ? 'page' : undefined}
                onClick={finishClose}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-control border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  currentPath === '/cart'
                    ? 'border-signal bg-primary text-primary-fg'
                    : 'border-border bg-surface-subtle text-ink hover:border-signal'
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{VI_MESSAGES.nav.cart}</span>
                </span>
                <span className="rounded-control border border-border-strong bg-surface px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-ink">
                  {totalCartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Hardware Tools */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] font-bold tracking-widest text-accent-ink uppercase">
              {VI_MESSAGES.nav.mobileToolsSection}
            </p>
            <div className="flex flex-col gap-1.5">
              {HARDWARE_TOOL_LINKS.map((item) => {
                const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={finishClose}
                    className={`flex min-h-12 items-start gap-3 rounded-control border-2 px-3 py-2.5 transition-colors ${
                      active
                        ? 'border-signal bg-highlight text-highlight-fg'
                        : 'border-border bg-surface-subtle text-ink hover:border-signal'
                    }`}
                  >
                    <item.Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-xs text-ink-muted">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Theme, SFX & Music Player */}
          <div className="flex flex-col gap-3 rounded-card border-2 border-border-strong bg-surface-subtle p-3">
            <p className="font-mono text-[11px] font-bold tracking-widest text-accent-ink uppercase">
              {VI_MESSAGES.nav.mobileMediaSection}
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-ink">{VI_MESSAGES.nav.mobileThemeLabel}</span>
              <ThemeToggle testId={TEST_IDS.header.themeToggle} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-2.5">
              <span className="text-xs font-semibold text-ink">{VI_MESSAGES.nav.mobileSfxLabel}</span>
              <SfxToggle testId={TEST_IDS.header.sfxToggle} />
            </div>
            <div className="border-t border-border pt-2.5">
              <MusicPlayerBar />
            </div>
          </div>

          {/* Policies */}
          <div className="flex flex-col gap-2 pb-4">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-widest text-ink-muted uppercase">
              <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.nav.mobilePoliciesSection}</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {POLICY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={finishClose}
                  className="flex min-h-10 items-center rounded-control border border-border bg-surface-subtle px-2.5 py-1.5 font-medium text-ink-muted hover:border-signal hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </dialog>
  );
}
