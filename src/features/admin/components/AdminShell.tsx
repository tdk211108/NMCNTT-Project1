'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useAdminSession } from '../useAdminSession';

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, actions } = useAdminSession();
  const { state: authState } = useAuthSession();

  if (state.isLoading) {
    return <Spinner />;
  }

  if (!state.isAdmin) {
    if (authState.isAuthenticated) {
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
          <Button variant="primary" onClick={actions.openLoginModal}>
            {VI_MESSAGES.admin.loginSubmit}
          </Button>
        }
      />
    );
  }

  const navItems = [
    { href: '/admin', label: VI_MESSAGES.admin.navDashboard, testId: undefined },
    { href: '/admin/products', label: VI_MESSAGES.admin.navProducts, testId: TEST_IDS.admin.navProducts },
    { href: '/admin/gpu-series', label: VI_MESSAGES.admin.navGpuSeries, testId: TEST_IDS.admin.navGpuSeries },
    { href: '/admin/legacy-cpus', label: VI_MESSAGES.admin.navLegacyCpus, testId: TEST_IDS.admin.navLegacyCpus },
    { href: '/admin/orders', label: VI_MESSAGES.admin.navOrders, testId: TEST_IDS.admin.navOrders },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <nav aria-label="Điều hướng quản trị" className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} data-testid={item.testId}>
                <Button size="sm" cyber={false} sfx="toggle" variant={active ? 'primary' : 'outline'}>
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <Button
          variant="ghost"
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
