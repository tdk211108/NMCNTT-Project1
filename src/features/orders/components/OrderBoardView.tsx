import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatDateTimeVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useOrderBoardController } from '../useOrderBoardController';

export type OrderBoardViewProps = ReturnType<typeof useOrderBoardController>;

export function OrderBoardView({ state, actions }: OrderBoardViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  if (state.needsLookup) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.orders.lookupTitle}</h1>
        <Card>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await actions.onSubmitLookup();
              } catch {
                // Error shown via state.lookupError.
              }
            }}
            className="flex flex-col gap-4"
          >
            <p className="text-sm text-ink-muted">{VI_MESSAGES.orders.sessionExpiredLookupPrompt}</p>
            <Input
              label={VI_MESSAGES.orders.lookupOrderIdLabel}
              value={state.orderId}
              readOnly
              data-testid={TEST_IDS.orders.lookupOrderId}
            />
            <Input
              type="tel"
              inputMode="tel"
              label={VI_MESSAGES.orders.lookupPhoneLabel}
              required
              autoComplete="tel"
              value={state.lookupPhone}
              data-testid={TEST_IDS.orders.lookupPhone}
              onChange={(e) => actions.onChangeLookupPhone(e.target.value)}
            />
            {state.lookupError ? (
              <p
                role="alert"
                data-testid={TEST_IDS.orders.lookupError}
                className="rounded-control border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {state.lookupError}
              </p>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              isLoading={state.isLookingUp}
              data-testid={TEST_IDS.orders.lookupSubmit}
            >
              {VI_MESSAGES.orders.lookupSubmit}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (state.fetchError || !state.board) {
    return (
      <EmptyState
        title={state.fetchError ?? VI_MESSAGES.orders.lookupGenericError}
        action={
          <Link href="/orders/lookup">
            <Button variant="primary">{VI_MESSAGES.orders.lookupTitle}</Button>
          </Link>
        }
      />
    );
  }

  const { board } = state;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.orders.boardTitle}</h1>
          <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.orders.saveIdReminder}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid={TEST_IDS.orders.idDisplay}
            className="rounded-control border border-border-strong bg-surface-elevated px-3 py-1.5 font-mono text-lg font-bold text-primary"
          >
            {board.orderId}
          </span>
          <Button
            variant="outline"
            size="sm"
            data-testid={TEST_IDS.orders.idCopy}
            onClick={actions.onCopyOrderId}
          >
            {VI_MESSAGES.orders.copyOrderId}
          </Button>
        </div>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {board.stages.map((entry) => {
            const reached = entry.reachedAt !== null;
            const current = entry.stage === board.stage;
            return (
              <div
                key={entry.stage}
                data-testid={TEST_IDS.orders.stage(entry.stage)}
                data-active={current ? 'true' : 'false'}
                data-reached={reached ? 'true' : 'false'}
                className={`flex flex-col gap-1 rounded-control border p-3 text-sm ${
                  current
                    ? 'border-accent bg-surface-elevated'
                    : reached
                      ? 'border-success/50 bg-highlight'
                      : 'border-border bg-surface-subtle opacity-60'
                }`}
              >
                <span className="font-semibold text-ink">{entry.label}</span>
                <span className="text-xs text-ink-muted">
                  {entry.reachedAt ? formatDateTimeVi(entry.reachedAt) : ''}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          {board.isCompleted ? (
            <Badge
              variant="success"
              data-testid={TEST_IDS.orders.completedMessage}
              className="px-3 py-1.5 text-sm"
            >
              {VI_MESSAGES.orders.completedMessage}
            </Badge>
          ) : (
            <Button
              variant="demo"
              isLoading={state.isAdvancing}
              data-testid={TEST_IDS.orders.demoAdvance}
              onClick={actions.onAdvanceStage}
            >
              {VI_MESSAGES.orders.demoAdvanceButton}
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 text-sm lg:col-span-1">
          <h2 className="text-base font-semibold text-ink">{VI_MESSAGES.orders.customerHeading}</h2>
          <p className="font-medium text-ink">{board.customer.fullName}</p>
          <p className="text-ink-muted">{board.customer.phoneMasked}</p>
          <p className="text-ink-muted">{board.customer.addressLine}</p>
          {board.customer.note ? (
            <p className="text-ink-muted">{board.customer.note}</p>
          ) : null}
          <div className="mt-2 border-t border-border pt-2">
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentMethodLabel}:{' '}
              <span className="text-ink">{VI_MESSAGES.checkout.paymentMethods[board.paymentMethod]}</span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentReferenceLabel}:{' '}
              <span className="font-mono text-ink">{board.paymentReference}</span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.createdAtLabel}:{' '}
              <span className="text-ink">{formatDateTimeVi(board.createdAt)}</span>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-base font-semibold text-ink">{VI_MESSAGES.orders.itemsHeading}</h2>
          <ResponsiveTableWrapper label={VI_MESSAGES.orders.itemsHeading}>
            <table className="w-full min-w-[460px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-3 py-2 font-semibold text-ink-muted">Sản phẩm</th>
                  <th className="px-3 py-2 font-semibold text-ink-muted">
                    {VI_MESSAGES.cart.unitPriceLabel}
                  </th>
                  <th className="px-3 py-2 font-semibold text-ink-muted">
                    {VI_MESSAGES.cart.quantityLabel}
                  </th>
                  <th className="px-3 py-2 font-semibold text-ink-muted">
                    {VI_MESSAGES.cart.lineTotalLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2 font-medium text-ink">{item.productName}</td>
                    <td className="px-3 py-2 text-ink-muted">{formatVnd(item.unitPriceVnd)}</td>
                    <td className="px-3 py-2 text-ink">{item.quantity}</td>
                    <td className="px-3 py-2 font-medium text-ink">{formatVnd(item.lineTotalVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>

          <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
              <span className="text-ink">{formatVnd(board.subtotalVnd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
              <span className="text-ink">
                {board.shippingFeeVnd === 0
                  ? VI_MESSAGES.common.freeShippingLabel
                  : formatVnd(board.shippingFeeVnd)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-ink">{VI_MESSAGES.cart.total}</span>
              <span className="text-primary">{formatVnd(board.totalVnd)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
