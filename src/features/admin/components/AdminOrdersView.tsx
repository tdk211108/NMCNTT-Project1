import Link from 'next/link';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge } from '@/components/ui/Icons';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatDateTimeVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useAdminOrdersController } from '../useAdminOrdersController';

export type AdminOrdersViewProps = ReturnType<typeof useAdminOrdersController>;

export function AdminOrdersView({ state }: AdminOrdersViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="bag-check-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.navOrders}</h1>
      </div>

      {state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : state.orders.length === 0 ? (
        <EmptyState title={VI_MESSAGES.common.noData} />
      ) : (
        <ResponsiveTableWrapper label={VI_MESSAGES.admin.navOrders}>
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-surface-subtle/85">
                <th className="px-4 py-3 font-semibold text-ink-muted">Mã đơn</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Khách hàng</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">SĐT</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Tổng tiền</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Thời gian</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.orders.map((order) => (
                <tr
                  key={order.orderId}
                  data-testid={TEST_IDS.admin.orderRow(order.orderId)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-subtle/60"
                >
                  <td className="px-4 py-3 font-mono font-bold text-primary">{order.orderId}</td>
                  <td className="px-4 py-3 font-medium text-ink">{order.customerName}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{order.phone}</td>
                  <td className="px-4 py-3 font-mono font-semibold tabular-nums text-primary">
                    {formatVnd(order.totalVnd)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={order.stage === 4 ? 'success' : 'accent'}>
                      {order.stageLabel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink-muted">
                    {formatDateTimeVi(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${order.orderId}`}
                      data-testid={TEST_IDS.admin.orderOpen(order.orderId)}
                    >
                      <Button variant="outline" size="sm">
                        Mở bảng đơn
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrapper>
      )}
    </div>
  );
}
