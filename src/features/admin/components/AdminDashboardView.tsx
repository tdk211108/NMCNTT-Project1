import Link from 'next/link';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useAdminDashboardController } from '../useAdminDashboardController';

export type AdminDashboardViewProps = ReturnType<typeof useAdminDashboardController>;

export function AdminDashboardView({ state, actions }: AdminDashboardViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.dashboardTitle}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products">
          <Card className="hover:border-border-strong">
            <h2 className="font-semibold text-ink">{VI_MESSAGES.admin.navProducts}</h2>
          </Card>
        </Link>
        <Link href="/admin/gpu-series">
          <Card className="hover:border-border-strong">
            <h2 className="font-semibold text-ink">{VI_MESSAGES.admin.navGpuSeries}</h2>
          </Card>
        </Link>
        <Link href="/admin/legacy-cpus">
          <Card className="hover:border-border-strong">
            <h2 className="font-semibold text-ink">{VI_MESSAGES.admin.navLegacyCpus}</h2>
          </Card>
        </Link>
        <Link href="/admin/orders">
          <Card className="hover:border-border-strong">
            <h2 className="font-semibold text-ink">{VI_MESSAGES.admin.navOrders}</h2>
          </Card>
        </Link>
      </div>

      <Card className="flex flex-col gap-4 border-danger/40">
        <div>
          <h2 className="text-lg font-semibold text-ink">{VI_MESSAGES.admin.resetSectionTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.admin.resetSectionDesc}</p>
        </div>
        <div>
          <Button
            variant="danger"
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
