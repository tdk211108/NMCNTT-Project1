'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { SolarIcon, type SolarIconName } from '@/components/ui/Icons';
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
            <Button variant="secondary" isLoading={state.isLoggingOut} onClick={actions.logout}>
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

  const navItems: Array<{
    href: string;
    label: string;
    testId?: string;
    icon: SolarIconName;
  }> = [
    {
      href: '/admin',
      label: VI_MESSAGES.admin.navDashboard,
      icon: 'layers-bold-duotone',
    },
    {
      href: '/admin/products',
      label: VI_MESSAGES.admin.navProducts,
      testId: TEST_IDS.admin.navProducts,
      icon: 'cpu-bold-duotone',
    },
    {
      href: '/admin/gpu-series',
      label: VI_MESSAGES.admin.navGpuSeries,
      testId: TEST_IDS.admin.navGpuSeries,
      icon: 'monitor-bold-duotone',
    },
    {
      href: '/admin/legacy-cpus',
      label: VI_MESSAGES.admin.navLegacyCpus,
      testId: TEST_IDS.admin.navLegacyCpus,
      icon: 'tuning-2-bold-duotone',
    },
    {
      href: '/admin/orders',
      label: VI_MESSAGES.admin.navOrders,
      testId: TEST_IDS.admin.navOrders,
      icon: 'bag-check-bold-duotone',
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 lg:flex-nowrap">
        <nav
          aria-label="Điều hướng quản trị"
          className="flex flex-wrap items-center gap-1.5 lg:flex-nowrap"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                className="shrink-0"
              >
                <Button
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  className="whitespace-nowrap"
                >
                  <SolarIcon name={item.icon} className="h-4 w-4" withShadow={false} />
                  <span>{item.label}</span>
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
          className="shrink-0 whitespace-nowrap"
        >
          <SolarIcon name="logout-2-bold-duotone" className="h-4 w-4" withShadow={false} />
          <span>{VI_MESSAGES.admin.logout}</span>
        </Button>
      </Card>

      {children}
    </div>
  );
}
