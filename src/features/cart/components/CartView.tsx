import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Info,
  Minus,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { CartAdvisoryItem, CartAdvisorySummary } from '@/shared/types';
import type { useCartController } from '../useCartController';

export type CartViewProps = ReturnType<typeof useCartController>;

function formatCartAdvisoryText(item: CartAdvisoryItem): string {
  const msgs = VI_MESSAGES.cart.advisories;
  switch (item.code) {
    case 'multi_cpu_conflict':
      return item.sockets && item.sockets.length > 1
        ? msgs.multiCpuSockets(item.sockets)
        : msgs.multiCpuCount(item.count ?? 2);
    case 'cpu_ram_platform':
      return msgs.cpuRamPlatform(item.sockets?.[0] ?? '', item.ramKind ?? 'ddr4_only');
    case 'psu_recommendation':
      if (item.psuExceedsMaxTier) {
        return msgs.psuExceedsMax(item.psuExactW ?? 1200);
      }
      if (item.psuTierW !== undefined && item.psuTierW !== null) {
        return msgs.psuTier(item.psuTierW, item.psuExactW ?? item.psuTierW);
      }
      if (item.actionHref?.includes('gpu=')) {
        return msgs.psuGpuOnly(item.productName ?? 'GPU', item.wattageW ?? 0);
      }
      return msgs.psuCpuOnly(item.productName ?? 'CPU', item.wattageW ?? 0);
    case 'gpu_large_size':
      return msgs.gpuLargeSize(
        item.productName ?? 'GPU',
        item.lengthMm ?? 0,
        String(item.slotThickness ?? 3),
      );
    case 'pair_imbalance':
      return msgs.pairImbalance(item.cpuScore ?? 0, item.gpuScore ?? 0);
  }
}

function AdvisoryRow({ item }: { item: CartAdvisoryItem }) {
  const msgs = VI_MESSAGES.cart.advisories;
  const actionLabel =
    item.actionKind === 'combo' ? msgs.actionCombo : msgs.actionPsu;

  const toneClass =
    item.severity === 'high'
      ? 'border-danger/70 bg-danger/10 text-danger'
      : item.severity === 'medium'
        ? 'border-warning/70 bg-warning/15 text-ink'
        : 'border-border-strong bg-surface-subtle text-ink';

  const Icon =
    item.severity === 'high'
      ? AlertTriangle
      : item.severity === 'medium'
        ? AlertCircle
        : Info;

  return (
    <div
      data-testid={TEST_IDS.cart.advisoryItem(item.code)}
      className={`flex flex-col gap-2 rounded-control border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between sm:text-sm ${toneClass}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            item.severity === 'medium'
              ? 'text-warning'
              : item.severity === 'info'
                ? 'text-accent-ink'
                : ''
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 wrap-anywhere font-medium leading-snug">
          {formatCartAdvisoryText(item)}
        </span>
      </div>

      {item.actionHref ? (
        <Link
          href={item.actionHref}
          className="inline-flex shrink-0 items-center gap-1 self-end whitespace-nowrap font-mono text-xs font-semibold text-accent-ink hover:underline sm:self-auto"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

function CartAdvisoriesPanel({
  advisories,
  isDismissed,
  onDismiss,
  onReopen,
}: {
  advisories: CartAdvisorySummary;
  isDismissed: boolean;
  onDismiss: () => void;
  onReopen: () => void;
}) {
  if (advisories.items.length === 0) {
    return null;
  }

  const msgs = VI_MESSAGES.cart.advisories;
  const hasHigh = advisories.items.some((item) => item.severity === 'high');

  if (isDismissed) {
    return (
      <div data-testid={TEST_IDS.cart.advisoryPill} className="flex items-center">
        <span className="inline-flex max-w-full rounded-control bg-surface">
          <button
            type="button"
            data-sfx="toggle"
            data-no-grid-cascade=""
            data-testid={TEST_IDS.cart.advisoryReopen}
            onClick={onReopen}
            className={`mtx-shadow-sm inline-flex min-h-10 cursor-pointer flex-wrap items-center gap-2 rounded-control border-2 px-3 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:text-sm ${
              hasHigh
                ? 'border-danger/80 bg-danger/10 text-danger hover:bg-danger/15'
                : 'border-warning/80 bg-surface text-ink hover:border-signal'
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 shrink-0 ${hasHigh ? '' : 'text-warning'}`}
              aria-hidden="true"
            />
            <span>
              {msgs.pillSummary(
                advisories.items.length,
                advisories.recommendedPsuTierW,
                advisories.psuExceedsMaxTier,
              )}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-accent-ink">
              <span>{msgs.reopenAction}</span>
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </button>
        </span>
      </div>
    );
  }

  return (
    <Card
      data-testid={TEST_IDS.cart.advisoryBanner}
      className={`flex flex-col gap-2.5 p-3.5 sm:p-4 ${
        hasHigh ? 'border-danger/80' : 'border-warning/80'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`h-4 w-4 shrink-0 ${hasHigh ? 'text-danger' : 'text-warning'}`}
            aria-hidden="true"
          />
          <h2 className="font-display text-sm font-bold text-ink sm:text-base">
            {msgs.heading} ({advisories.items.length})
          </h2>
        </div>

        <Button
          variant="ghost"
          size="xs"
          sfx="toggle"
          cyber={false}
          data-testid={TEST_IDS.cart.advisoryDismiss}
          onClick={onDismiss}
        >
          <X className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{msgs.dismissAction}</span>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {advisories.items.map((item) => (
          <AdvisoryRow key={item.code} item={item} />
        ))}
      </div>
    </Card>
  );
}

export function CartView({ state, actions }: CartViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.cart.title, href: '/cart' },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.cart.title}</h1>

      {state.errorMessage ? <EmptyState title={state.errorMessage} /> : null}

      {state.showEmptyNotice ? (
        <Card
          data-testid={TEST_IDS.cart.redirectNotice}
          data-no-grid-cascade=""
          className="border-warning/70 bg-surface p-3 text-sm text-ink"
        >
          <div className="flex items-start gap-2 rounded-control bg-warning/15 px-3 py-2 text-ink">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <span>{VI_MESSAGES.cart.emptyCartRedirectNotice}</span>
          </div>
        </Card>
      ) : null}

      {!state.isEmpty ? (
        <CartAdvisoriesPanel
          advisories={state.advisories}
          isDismissed={state.isAdvisoryDismissed}
          onDismiss={actions.onDismissAdvisory}
          onReopen={actions.onReopenAdvisory}
        />
      ) : null}

      {state.isEmpty ? (
        <EmptyState
          testId={TEST_IDS.cart.emptyNotice}
          title={VI_MESSAGES.cart.empty}
          action={
            <Link href="/cpu">
              <Button variant="primary">{VI_MESSAGES.common.backToStore}</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            {state.lines.map((line) => {
              const inputValue =
                state.draftQtyById[line.productId] ?? String(line.quantity);
              return (
                <Card
                  key={line.productId}
                  data-testid={TEST_IDS.cart.item(line.productId)}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ProductImage
                      src={line.imageUrl}
                      alt={line.name}
                      className="h-20 w-20 shrink-0 border border-border-strong object-contain p-1"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <Link
                        href={`/products/${line.productId}`}
                        className="min-w-0 wrap-anywhere font-semibold text-ink hover:text-accent-ink"
                      >
                        {line.name}
                      </Link>
                      <p className="min-w-0 wrap-anywhere font-mono text-sm tabular-nums text-ink-muted">
                        {VI_MESSAGES.cart.unitPriceLabel}: {formatVnd(line.unitPriceVnd)}
                      </p>
                      <p className="min-w-0 wrap-anywhere font-mono text-sm font-bold tabular-nums text-accent-ink">
                        {VI_MESSAGES.cart.lineTotalLabel}: {formatVnd(line.lineTotalVnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0 sm:flex-nowrap sm:justify-self-end">
                    <div className="flex shrink-0 items-center gap-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        cyber={false}
                        aria-label={VI_MESSAGES.cart.decreaseQtyAria(line.name)}
                        data-testid={TEST_IDS.cart.qtyDec(line.productId)}
                        onClick={() => actions.onDecrement(line.productId, line.quantity)}
                      >
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`${VI_MESSAGES.cart.quantityLabel} ${line.name}`}
                        value={inputValue}
                        data-testid={TEST_IDS.cart.qtyInput(line.productId)}
                        onChange={(e) =>
                          actions.onQtyInputChange(line.productId, e.target.value)
                        }
                        onBlur={() => actions.onQtyBlur(line.productId)}
                        className="min-h-9 w-16 rounded-control border-2 border-border-strong bg-surface-subtle px-2 text-center font-mono text-sm font-semibold tabular-nums text-ink focus-visible:outline-2 focus-visible:outline-signal"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        cyber={false}
                        aria-label={VI_MESSAGES.cart.increaseQtyAria(line.name)}
                        data-testid={TEST_IDS.cart.qtyInc(line.productId)}
                        onClick={() => actions.onIncrement(line.productId, line.quantity)}
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 whitespace-nowrap"
                      data-testid={TEST_IDS.cart.remove(line.productId)}
                      onClick={() => actions.onRequestRemove(line.productId)}
                    >
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{VI_MESSAGES.cart.removeButton}</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <aside className="flex min-w-0 flex-col gap-3 lg:col-span-1">
            <Card className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.totalQuantityLabel}</span>
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {state.totalQuantity}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
                <span
                  data-testid={TEST_IDS.cart.subtotal}
                  className="font-mono font-semibold tabular-nums text-ink"
                >
                  {formatVnd(state.subtotalVnd)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
                <span
                  data-testid={TEST_IDS.cart.shipping}
                  className="font-mono font-medium tabular-nums text-ink"
                >
                  {state.freeShipping ? (
                    <Badge variant="success">{VI_MESSAGES.common.freeShippingLabel}</Badge>
                  ) : (
                    formatVnd(state.shippingFeeVnd)
                  )}
                </span>
              </div>
              <p className="text-xs text-ink-muted">{VI_MESSAGES.cart.freeShippingHint}</p>
              <div className="flex justify-between border-t-2 border-border pt-3 text-base font-bold">
                <span className="text-ink">{VI_MESSAGES.cart.total}</span>
                <span
                  data-testid={TEST_IDS.cart.total}
                  className="font-mono tabular-nums text-accent-ink"
                >
                  {formatVnd(state.totalVnd)}
                </span>
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={state.lines.length === 0}
                data-testid={TEST_IDS.cart.checkout}
                onClick={actions.onProceedToCheckout}
              >
                <span>{VI_MESSAGES.cart.proceedToCheckout}</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </Button>
            </Card>

            <Card
              data-testid={TEST_IDS.cart.taxNote}
              data-no-grid-cascade=""
              className="flex items-start gap-2.5 bg-surface px-4 py-3 text-xs text-ink sm:text-sm"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
              <p className="min-w-0 wrap-anywhere font-medium leading-snug">
                {VI_MESSAGES.cart.taxIncludedNote}
              </p>
            </Card>
          </aside>
        </div>
      )}

      <AlertDialog
        open={state.pendingRemoveId !== null}
        title={VI_MESSAGES.cart.removeConfirmTitle}
        description={VI_MESSAGES.cart.removeConfirmBody}
        confirmLabel={VI_MESSAGES.common.confirm}
        cancelLabel={VI_MESSAGES.common.cancel}
        confirmTestId={TEST_IDS.cart.removeConfirm}
        cancelTestId={TEST_IDS.cart.removeCancel}
        onConfirm={actions.onConfirmRemove}
        onCancel={actions.onCancelRemove}
      />
    </div>
  );
}
