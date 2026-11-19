import Link from 'next/link';
import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
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
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.navOrders}</h1>

      {state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : state.orders.length === 0 ? (
        <EmptyState title={VI_MESSAGES.common.noData} />
      ) : (
        <ResponsiveTableWrapper label={VI_MESSAGES.admin.navOrders}>
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Mã đơn</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Khách hàng</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">SĐT</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Tổng tiền</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Trạng thái</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Thời gian</th>
                <th className="px-3 py-2.5 font-semibold text-ink-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.orders.map((order) => (
                <tr
                  key={order.orderId}
                  data-testid={TEST_IDS.admin.orderRow(order.orderId)}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2.5 font-mono font-semibold text-ink">{order.orderId}</td>
                  <td className="px-3 py-2.5 text-ink">{order.customerName}</td>
                  <td className="px-3 py-2.5 text-ink">{order.phone}</td>
                  <td className="px-3 py-2.5 font-medium text-primary">
                    {formatVnd(order.totalVnd)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={order.stage === 4 ? 'success' : 'default'}>
                      {order.stageLabel}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-ink-muted">
                    {formatDateTimeVi(order.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
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
