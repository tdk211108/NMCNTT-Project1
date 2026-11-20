import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge, SolarIcon, type SolarIconName } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatDateTimeVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useOrderBoardController } from '../useOrderBoardController';

export type OrderBoardViewProps = ReturnType<typeof useOrderBoardController>;

const STAGE_ICONS: Record<number, SolarIconName> = {
  0: 'cart-large-minimalistic-bold-duotone',
  1: 'box-bold-duotone',
  2: 'delivery-bold-duotone',
  3: 'routing-2-bold-duotone',
  4: 'bag-check-bold-duotone',
};

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
              className="font-mono"
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
  const maxIndex = Math.max(1, board.stages.length - 1);
  const progressPct = Math.min(100, Math.max(0, (board.stage / maxIndex) * 100));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <AeroIconBadge name="delivery-bold-duotone" size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.orders.boardTitle}</h1>
            <p className="mt-0.5 text-sm text-ink-muted">{VI_MESSAGES.orders.saveIdReminder}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid={TEST_IDS.orders.idDisplay}
            className="aero-glass rounded-full px-4 py-1.5 font-mono text-lg font-bold text-primary"
          >
            {board.orderId}
          </span>
          <Button
            variant="secondary"
            size="sm"
            data-testid={TEST_IDS.orders.idCopy}
            onClick={actions.onCopyOrderId}
          >
            <SolarIcon name="copy-bold-duotone" className="h-4 w-4 text-primary" withShadow={false} />
            <span>{VI_MESSAGES.orders.copyOrderId}</span>
          </Button>
        </div>
      </div>

      {/* Shopee-style connected 5-stage progress stepper */}
      <Card className="flex flex-col gap-6">
        <div className="relative">
          {/* Desktop horizontal connecting track behind the 5 circular milestone nodes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 right-[10%] left-[10%] z-0 hidden h-1.5 overflow-hidden rounded-full bg-surface-subtle ring-1 ring-border sm:block"
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#4ade80_0%,#22c55e_60%,#059669_100%)] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Mobile vertical connecting track for narrow 360px viewports */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-6 bottom-6 left-6 z-0 w-1 overflow-hidden rounded-full bg-surface-subtle ring-1 ring-border sm:hidden"
          >
            <div
              className="w-full rounded-full bg-[linear-gradient(180deg,#4ade80_0%,#059669_100%)] transition-[height] duration-300 ease-out"
              style={{ height: `${progressPct}%` }}
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-5 sm:gap-2">
            {board.stages.map((entry) => {
              const reached = entry.reachedAt !== null;
              const current = entry.stage === board.stage;
              const iconName = STAGE_ICONS[entry.stage] ?? 'box-bold-duotone';

              return (
                <div
                  key={entry.stage}
                  data-testid={TEST_IDS.orders.stage(entry.stage)}
                  data-active={current ? 'true' : 'false'}
                  data-reached={reached ? 'true' : 'false'}
                  className="relative flex items-start gap-3.5 sm:flex-col sm:items-center sm:gap-2.5 sm:text-center"
                >
                  <div
                    className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-[transform,box-shadow,border-color,background-color] duration-200 ${
                      current
                        ? 'aero-pill-cta scale-105 border-white/85 text-white'
                        : reached
                          ? 'border-emerald-500/75 bg-[#e6f9f1] text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_6px_16px_rgba(16,185,129,0.22)] dark:border-emerald-400/65 dark:bg-[#072b28] dark:text-emerald-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_16px_rgba(16,185,129,0.18)]'
                          : 'border-emerald-200 bg-[#f0fdf4] text-emerald-900/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] dark:border-emerald-400/25 dark:bg-[#071f18] dark:text-emerald-200/45 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    }`}
                  >
                    <SolarIcon
                      name={iconName}
                      className="relative z-1 h-5 w-5"
                      withShadow={false}
                    />
                  </div>

                  <div
                    className={`flex min-w-0 flex-1 flex-col pt-1 sm:items-center sm:pt-0 ${
                      reached ? 'opacity-100' : 'opacity-65'
                    }`}
                  >
                    <span
                      className={`text-sm leading-snug font-semibold ${
                        current ? 'text-primary' : reached ? 'text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {entry.label}
                    </span>
                    <span className="mt-0.5 font-mono text-xs tabular-nums text-ink-muted">
                      {entry.reachedAt ? formatDateTimeVi(entry.reachedAt) : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
          {board.isCompleted ? (
            <Badge
              variant="success"
              data-testid={TEST_IDS.orders.completedMessage}
              className="px-4 py-1.5 text-sm"
            >
              <SolarIcon name="check-circle-bold-duotone" className="h-4 w-4" withShadow={false} />
              <span>{VI_MESSAGES.orders.completedMessage}</span>
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
          <h2 className="text-base font-bold text-ink">{VI_MESSAGES.orders.customerHeading}</h2>
          <p className="font-semibold text-ink">{board.customer.fullName}</p>
          <p className="font-mono text-ink-muted">{board.customer.phoneMasked}</p>
          <p className="text-ink-muted">{board.customer.addressLine}</p>
          {board.customer.note ? (
            <p className="text-ink-muted">{board.customer.note}</p>
          ) : null}
          <div className="mt-2 flex flex-col gap-1 border-t border-border/70 pt-3">
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentMethodLabel}:{' '}
              <span className="font-medium text-ink">
                {VI_MESSAGES.checkout.paymentMethods[board.paymentMethod]}
              </span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.paymentReferenceLabel}:{' '}
              <span className="font-mono font-medium text-ink">{board.paymentReference}</span>
            </p>
            <p className="text-ink-muted">
              {VI_MESSAGES.orders.createdAtLabel}:{' '}
              <span className="font-mono font-medium tabular-nums text-ink">
                {formatDateTimeVi(board.createdAt)}
              </span>
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-base font-bold text-ink">{VI_MESSAGES.orders.itemsHeading}</h2>
          <ResponsiveTableWrapper label={VI_MESSAGES.orders.itemsHeading}>
            <table className="w-full min-w-[460px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-surface-subtle/85">
                  <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap text-ink-muted">
                    Sản phẩm
                  </th>
                  <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap text-ink-muted">
                    {VI_MESSAGES.cart.unitPriceLabel}
                  </th>
                  <th className="px-3.5 py-2.5 text-center font-semibold whitespace-nowrap text-ink-muted">
                    {VI_MESSAGES.cart.quantityLabel}
                  </th>
                  <th className="px-3.5 py-2.5 text-right font-semibold whitespace-nowrap text-ink-muted">
                    {VI_MESSAGES.cart.lineTotalLabel}
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/60 last:border-b-0">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white p-1 shadow-xs ring-1 ring-white/80 dark:ring-emerald-300/20">
                          <ProductImage
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <span className="font-semibold text-ink">{item.productName}</span>
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 font-mono whitespace-nowrap tabular-nums text-ink-muted">
                      {formatVnd(item.unitPriceVnd)}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-mono whitespace-nowrap tabular-nums text-ink">
                      {item.quantity}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-mono font-semibold whitespace-nowrap tabular-nums text-ink">
                      {formatVnd(item.lineTotalVnd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>

          <div className="flex flex-col gap-1.5 border-t border-border/70 pt-3 text-sm">
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
              <span className="font-mono tabular-nums text-primary">{formatVnd(board.totalVnd)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
