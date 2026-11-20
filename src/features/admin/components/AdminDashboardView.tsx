import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useAdminDashboardController } from '../useAdminDashboardController';

export type AdminDashboardViewProps = ReturnType<typeof useAdminDashboardController>;

export function AdminDashboardView({ state, actions }: AdminDashboardViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="layers-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.dashboardTitle}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products">
          <Card className="flex items-center gap-3 transition-[transform,border-color] duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong">
            <AeroIconBadge name="cpu-bold-duotone" size="md" />
            <h2 className="font-bold text-ink">{VI_MESSAGES.admin.navProducts}</h2>
          </Card>
        </Link>
        <Link href="/admin/gpu-series">
          <Card className="flex items-center gap-3 transition-[transform,border-color] duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong">
            <AeroIconBadge name="monitor-bold-duotone" size="md" />
            <h2 className="font-bold text-ink">{VI_MESSAGES.admin.navGpuSeries}</h2>
          </Card>
        </Link>
        <Link href="/admin/legacy-cpus">
          <Card className="flex items-center gap-3 transition-[transform,border-color] duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong">
            <AeroIconBadge name="tuning-2-bold-duotone" size="md" />
            <h2 className="font-bold text-ink">{VI_MESSAGES.admin.navLegacyCpus}</h2>
          </Card>
        </Link>
        <Link href="/admin/orders">
          <Card className="flex items-center gap-3 transition-[transform,border-color] duration-150 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong">
            <AeroIconBadge name="bag-check-bold-duotone" size="md" />
            <h2 className="font-bold text-ink">{VI_MESSAGES.admin.navOrders}</h2>
          </Card>
        </Link>
      </div>

      <Card className="flex flex-col gap-4 border-danger/40">
        <div className="flex items-start gap-3">
          <AeroIconBadge name="danger-triangle-bold-duotone" size="md" className="text-danger" />
          <div>
            <h2 className="text-lg font-bold text-ink">{VI_MESSAGES.admin.resetSectionTitle}</h2>
            <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.admin.resetSectionDesc}</p>
          </div>
        </div>
        <div>
          <Button
            variant="danger"
            data-testid={TEST_IDS.admin.resetButton}
            onClick={actions.onOpenConfirm}
          >
            <SolarIcon name="restart-bold-duotone" className="h-4 w-4" withShadow={false} />
            <span>{VI_MESSAGES.admin.resetButton}</span>
          </Button>
        </div>

        {state.lastResetResult ? (
          <p className="font-mono text-xs text-ink-muted">
            Đã khôi phục {state.lastResetResult.productsRestored} sản phẩm, xóa{' '}
            {state.lastResetResult.ordersDeleted} đơn hàng, dọn{' '}
            {state.lastResetResult.imagesPurged} ảnh tải lên.
          </p>
        ) : null}
      </Card>

      <AlertDialog
        open={state.confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            actions.onCloseConfirm();
          }
        }}
      >
        <AlertDialogPortal>
          <AlertDialogBackdrop />
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>{VI_MESSAGES.admin.resetConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{VI_MESSAGES.admin.resetConfirmBody}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button variant="secondary" onClick={actions.onCloseConfirm}>
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                variant="danger"
                isLoading={state.isResetting}
                data-testid={TEST_IDS.admin.resetConfirm}
                onClick={actions.onConfirmReset}
              >
                {VI_MESSAGES.common.confirm}
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialogPortal>
      </AlertDialog>
    </div>
  );
}
