import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatDateTimeVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useMyOrdersController } from '../useMyOrdersController';

export type MyOrdersViewProps = ReturnType<typeof useMyOrdersController>;

export function MyOrdersView({ state, actions }: MyOrdersViewProps) {
  if (state.isAuthLoading) {
    return <Spinner />;
  }

  if (!state.isAuthenticated) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.myOrdersTitle}</h1>
        <EmptyState
          title={VI_MESSAGES.orders.myOrdersLoginPrompt}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={actions.onOpenLogin}>
                {VI_MESSAGES.nav.login}
              </Button>
              <Link href="/orders/lookup">
                <Button variant="outline">{VI_MESSAGES.orders.myOrdersCodeLookupLink}</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  if (state.isAdmin) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.myOrdersTitle}</h1>
        <EmptyState
          title={VI_MESSAGES.admin.navOrders}
          action={
            <Link href="/admin/orders">
              <Button variant="primary">{VI_MESSAGES.admin.navOrders}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.myOrdersTitle}</h1>
        <Link href="/orders/lookup">
          <Button variant="outline" size="sm">
            {VI_MESSAGES.orders.myOrdersCodeLookupLink}
          </Button>
        </Link>
      </div>

      {state.isLoading ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState
          title={state.errorMessage}
          action={
            <Button variant="primary" onClick={actions.onRetry}>
              {VI_MESSAGES.common.retry}
            </Button>
          }
        />
      ) : state.orders.length === 0 ? (
        <EmptyState
          testId={TEST_IDS.orders.myOrdersEmpty}
          title={VI_MESSAGES.orders.myOrdersEmpty}
          action={
            <Link href="/cpu">
              <Button variant="primary">{VI_MESSAGES.common.backToStore}</Button>
            </Link>
          }
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <ResponsiveTableWrapper label={VI_MESSAGES.orders.myOrdersTitle}>
            <table data-testid={TEST_IDS.orders.myOrdersList} className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-subtle text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">{VI_MESSAGES.orders.columns.orderId}</th>
                  <th className="px-4 py-3">{VI_MESSAGES.orders.columns.createdAt}</th>
                  <th className="px-4 py-3 text-right">{VI_MESSAGES.orders.columns.quantity}</th>
                  <th className="px-4 py-3 text-right">{VI_MESSAGES.orders.columns.total}</th>
                  <th className="px-4 py-3">{VI_MESSAGES.orders.columns.status}</th>
                  <th className="px-4 py-3 text-right">{VI_MESSAGES.orders.columns.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.orders.map((order) => (
                  <tr key={order.orderId} data-testid={TEST_IDS.orders.myOrdersRow(order.orderId)}>
                    <td className="px-4 py-3 font-mono font-semibold tabular-nums text-accent-ink">
                      {order.orderId}
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums text-ink-muted">
                      {formatDateTimeVi(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                      {order.totalQuantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-ink">
                      {formatVnd(order.totalVnd)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.stage === 4 ? 'success' : 'accent'}>
                        {order.stageLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/orders/${order.orderId}`}>
                        <Button variant="outline" size="sm">
                          {VI_MESSAGES.orders.myOrdersViewDetail}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>
        </Card>
      )}
    </div>
  );
}
