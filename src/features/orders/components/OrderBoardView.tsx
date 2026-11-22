import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Navigation,
  Package,
  PackageCheck,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { AnimatedCopyButton } from '@/components/ui/AnimatedCopyButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatDateTimeVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { OrderBoard } from '@/shared/types';
import type { useOrderBoardController } from '../useOrderBoardController';

export type OrderBoardViewProps = ReturnType<typeof useOrderBoardController>;

export interface OrderBoardPanelProps {
  board: OrderBoard;
  isAdvancing: boolean;
  onCopyOrderId: () => void | Promise<void>;
  onAdvanceStage: () => void;
  compactHeading?: boolean;
}

const STAGE_ICONS = [
  ClipboardCheck,
  Package,
  Truck,
  Navigation,
  PackageCheck,
] as const;

export function OrderBoardPanel({
  board,
  isAdvancing,
  onCopyOrderId,
  onAdvanceStage,
  compactHeading = false,
}: OrderBoardPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {compactHeading ? (
            <h3 className="font-display text-lg font-bold text-ink">{VI_MESSAGES.orders.boardTitle}</h3>
          ) : (
            <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.boardTitle}</h1>
          )}
          <p className="mt-1 text-sm text-ink-muted">{VI_MESSAGES.orders.saveIdReminder}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid={TEST_IDS.orders.idDisplay}
            className="rounded-control border-2 border-border-strong bg-surface-elevated px-3 py-1.5 font-mono text-lg font-bold tabular-nums text-accent-ink"
          >
            {board.orderId}
          </span>
          <AnimatedCopyButton
            textToCopy={board.orderId}
            label={VI_MESSAGES.orders.copyOrderId}
            copiedLabel={VI_MESSAGES.orders.copiedOrderId}
            testId={TEST_IDS.orders.idCopy}
            onCopied={onCopyOrderId}
          />
        </div>
      </div>

      <Card className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
          {board.stages.map((entry, idx) => {
            const reached = entry.reachedAt !== null;
            const current = entry.stage === board.stage;
            const hasNext = idx < board.stages.length - 1;
            const nextReached = hasNext && board.stages[idx + 1]?.reachedAt !== null;
            const StageIcon = STAGE_ICONS[entry.stage] ?? Check;

            const iconBoxClasses = current
              ? 'border-border-strong bg-primary text-primary-fg mtx-shadow-sm'
              : reached
                ? 'border-border-strong bg-success text-success-fg'
                : 'border-border-strong bg-surface-elevated text-ink-muted';

            return (
              <div
                key={entry.stage}
                data-testid={TEST_IDS.orders.stage(entry.stage)}
                data-active={current ? 'true' : 'false'}
                data-reached={reached ? 'true' : 'false'}
                className="relative flex items-start gap-3 pb-6 last:pb-0 sm:flex-col sm:items-center sm:px-2 sm:pb-0 sm:text-center"
              >
                {hasNext ? (
                  <>
                    <div
                      aria-hidden="true"
                      className={`absolute top-12 bottom-0 left-[23px] z-0 w-1 -translate-x-1/2 sm:hidden ${
                        nextReached ? 'bg-success' : 'bg-border'
                      }`}
                    />
                    <div
                      aria-hidden="true"
                      className={`absolute top-6 left-[calc(50%+30px)] z-0 hidden h-1 w-[calc(100%-60px)] sm:block ${
                        nextReached ? 'bg-success' : 'bg-border'
                      }`}
                    />
                  </>
                ) : null}

                {/* Opaque bg-surface wrapper guarantees zero track line pixels bleed behind the milestone icon */}
                <div className="relative z-10 shrink-0 bg-surface p-1">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${iconBoxClasses}`}
                  >
                    <StageIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  </div>
                </div>

                <div className="relative z-10 flex min-w-0 flex-col gap-0.5 pt-1 sm:items-center sm:pt-2">
                  <span
                    className={`font-mono text-[11px] font-bold tracking-wider tabular-nums ${
                      current ? 'text-accent-ink' : 'text-ink-muted'
                    }`}
                  >
                    0{idx + 1}
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      current || reached ? 'text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {entry.label}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-ink-muted">
                    {entry.reachedAt ? formatDateTimeVi(entry.reachedAt) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-border pt-3">
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
              isLoading={isAdvancing}
              data-testid={TEST_IDS.orders.demoAdvance}
              onClick={onAdvanceStage}
            >
              <span>{VI_MESSAGES.orders.demoAdvanceButton}</span>
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col gap-2 text-sm lg:col-span-1">
          <h2 className="font-display text-base font-bold text-ink">{VI_MESSAGES.orders.customerHeading}</h2>
          <p className="font-medium text-ink">{board.customer.fullName}</p>
          <p className="font-mono tabular-nums text-ink-muted">{board.customer.phoneMasked}</p>
          <p className="text-ink-muted">{board.customer.addressLine}</p>
          {board.customer.note ? (
            <p className="text-ink-muted">{board.customer.note}</p>
          ) : null}
          <div className="mt-2 border-t-2 border-border pt-2">
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentMethodLabel}:{' '}
              <span className="text-ink">{VI_MESSAGES.checkout.paymentMethods[board.paymentMethod]}</span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentReferenceLabel}:{' '}
              <span className="font-mono tabular-nums text-ink">{board.paymentReference}</span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.createdAtLabel}:{' '}
              <span className="font-mono tabular-nums text-ink">{formatDateTimeVi(board.createdAt)}</span>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="font-display text-base font-bold text-ink">{VI_MESSAGES.orders.itemsHeading}</h2>
          <ResponsiveTableWrapper label={VI_MESSAGES.orders.itemsHeading}>
            <table className="w-full min-w-[460px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-surface-subtle">
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
                    <td className="px-3 py-2 font-medium text-ink">
                      <div className="flex items-center gap-2.5">
                        <ProductImage
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-11 w-11 shrink-0 border border-border-strong object-contain p-0.5"
                        />
                        <span>{item.productName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-ink-muted">
                      {formatVnd(item.unitPriceVnd)}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums text-ink">{item.quantity}</td>
                    <td className="px-3 py-2 font-mono font-semibold tabular-nums text-ink">
                      {formatVnd(item.lineTotalVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>

          <div className="flex flex-col gap-1 border-t-2 border-border pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
              <span className="font-mono tabular-nums text-ink">{formatVnd(board.subtotalVnd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
              <span className="font-mono tabular-nums text-ink">
                {board.shippingFeeVnd === 0
                  ? VI_MESSAGES.common.freeShippingLabel
                  : formatVnd(board.shippingFeeVnd)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-ink">{VI_MESSAGES.cart.total}</span>
              <span className="font-mono tabular-nums text-accent-ink">{formatVnd(board.totalVnd)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function OrderBoardView({ state, actions }: OrderBoardViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  if (state.needsLookup) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.lookupTitle}</h1>
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
                className="rounded-control border-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
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

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.orders.lookupTitle, href: '/orders/lookup' },
          { label: state.board.orderId, href: `/orders/${state.board.orderId}` },
        ]}
      />
      <OrderBoardPanel
        board={state.board}
        isAdvancing={state.isAdvancing}
        onCopyOrderId={actions.onCopyOrderId}
        onAdvanceStage={actions.onAdvanceStage}
      />
    </div>
  );
}
