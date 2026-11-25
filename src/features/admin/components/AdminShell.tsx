'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button, CyberButtonLayers, getButtonClassNames } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useAuthSession } from '@/features/auth/useAuthSession';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, actions } = useAuthSession();

  if (state.isLoading) {
    return <Spinner />;
  }

  if (!state.isAdmin) {
    if (state.isAuthenticated) {
      return (
        <EmptyState
          title={VI_MESSAGES.admin.loginTitle}
          description={VI_MESSAGES.admin.notAdminNotice}
          action={
            <Button variant="outline" isLoading={state.isLoggingOut} onClick={actions.logout}>
              {VI_MESSAGES.admin.logout}
            </Button>
          }
        />
      );
    }
    return (
      <EmptyState
        title={VI_MESSAGES.admin.loginTitle}
        description={VI_MESSAGES.admin.loginRequiredNotice}
        action={
          <Button variant="primary" onClick={() => actions.openAuthModal({ tab: 'login' })}>
            {VI_MESSAGES.admin.loginSubmit}
          </Button>
        }
      />
    );
  }

  const navItems = [
    { href: '/admin', label: VI_MESSAGES.admin.navDashboard, testId: TEST_IDS.admin.navDashboard },
    { href: '/admin/products', label: VI_MESSAGES.admin.navProducts, testId: TEST_IDS.admin.navProducts },
    { href: '/admin/gpu-series', label: VI_MESSAGES.admin.navGpuSeries, testId: TEST_IDS.admin.navGpuSeries },
    { href: '/admin/legacy-cpus', label: VI_MESSAGES.admin.navLegacyCpus, testId: TEST_IDS.admin.navLegacyCpus },
    { href: '/admin/orders', label: VI_MESSAGES.admin.navOrders, testId: TEST_IDS.admin.navOrders },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <nav aria-label="Điều hướng quản trị" className="flex flex-wrap items-center gap-2.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const { classes } = getButtonClassNames({
              size: 'sm',
              variant: active ? 'primary' : 'outline',
              cyber: true,
            });
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                data-sfx="toggle"
                aria-current={active ? 'page' : undefined}
                className={classes}
              >
                <CyberButtonLayers glitchContent={item.label} />
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <Button
          variant="outline"
          size="sm"
          isLoading={state.isLoggingOut}
          data-testid={TEST_IDS.admin.logout}
          onClick={actions.logout}
        >
          {VI_MESSAGES.admin.logout}
        </Button>
      </div>

      {children}
    </div>
  );
}
