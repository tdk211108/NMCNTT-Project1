import { ArrowRight, ClipboardList, Cpu, Layers, Package } from 'lucide-react';
import Link from 'next/link';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useAdminDashboardController } from '../useAdminDashboardController';

export type AdminDashboardViewProps = ReturnType<typeof useAdminDashboardController>;

const DASHBOARD_SHORTCUTS = [
  {
    href: '/admin/products',
    code: '01',
    label: VI_MESSAGES.admin.navProducts,
    testId: TEST_IDS.admin.dashboardCardProducts,
    Icon: Package,
  },
  {
    href: '/admin/gpu-series',
    code: '02',
    label: VI_MESSAGES.admin.navGpuSeries,
    testId: TEST_IDS.admin.dashboardCardGpuSeries,
    Icon: Layers,
  },
  {
    href: '/admin/legacy-cpus',
    code: '03',
    label: VI_MESSAGES.admin.navLegacyCpus,
    testId: TEST_IDS.admin.dashboardCardLegacyCpus,
    Icon: Cpu,
  },
  {
    href: '/admin/orders',
    code: '04',
    label: VI_MESSAGES.admin.navOrders,
    testId: TEST_IDS.admin.dashboardCardOrders,
    Icon: ClipboardList,
  },
] as const;

export function AdminDashboardView({ state, actions }: AdminDashboardViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.admin.dashboardTitle}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DASHBOARD_SHORTCUTS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-testid={item.testId}
            className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <Card className="flex h-full flex-col justify-between gap-3 motion-safe:transition-[transform,box-shadow,border-color,background-color] duration-150 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:border-signal group-hover:bg-surface-elevated group-hover:shadow-[6px_6px_0_0_var(--color-primary)] group-active:translate-x-[3px] group-active:translate-y-[3px] group-active:border-primary group-active:shadow-none">
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <span className="font-mono text-[11px] font-bold tracking-widest text-accent-ink">
                  ADMIN // {item.code}
                </span>
                <item.Icon
                  className="h-4 w-4 text-ink-muted motion-safe:transition-colors duration-150 group-hover:text-signal"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-ink motion-safe:transition-colors duration-150 group-hover:text-accent-ink">
                  {item.label}
                </h2>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-ink-muted motion-safe:transition-[transform,color] duration-150 group-hover:translate-x-1 group-hover:text-signal group-active:translate-x-1.5"
                  aria-hidden="true"
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="flex flex-col gap-4 border-danger/40">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{VI_MESSAGES.admin.resetSectionTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.admin.resetSectionDesc}</p>
        </div>
        <div>
          <Button
            variant="danger"
            cyberTag="RST"
            data-testid={TEST_IDS.admin.resetButton}
            onClick={actions.onOpenConfirm}
          >
            {VI_MESSAGES.admin.resetButton}
          </Button>
        </div>

        {state.lastResetResult ? (
          <p className="text-xs text-ink-muted">
            Đã khôi phục {state.lastResetResult.productsRestored} sản phẩm, xóa{' '}
            {state.lastResetResult.ordersDeleted} đơn hàng, dọn{' '}
            {state.lastResetResult.imagesPurged} ảnh tải lên.
          </p>
        ) : null}
      </Card>

      <AlertDialog
        open={state.confirmOpen}
        title={VI_MESSAGES.admin.resetConfirmTitle}
        description={VI_MESSAGES.admin.resetConfirmBody}
        confirmLabel={VI_MESSAGES.common.confirm}
        cancelLabel={VI_MESSAGES.common.cancel}
        isConfirming={state.isResetting}
        confirmTestId={TEST_IDS.admin.resetConfirm}
        onConfirm={actions.onConfirmReset}
        onCancel={actions.onCloseConfirm}
      />
    </div>
  );
}
