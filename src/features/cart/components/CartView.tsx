import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Modal } from '@/components/ui/Modal';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useCartController } from '../useCartController';

export type CartViewProps = ReturnType<typeof useCartController>;

export function CartView({ state, actions }: CartViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.cart.title}</h1>

      {state.errorMessage ? <EmptyState title={state.errorMessage} /> : null}

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
          <div className="flex flex-col gap-3 lg:col-span-2">
            {state.lines.map((line) => {
              const inputValue =
                state.draftQtyById[line.productId] ?? String(line.quantity);
              return (
                <Card
                  key={line.productId}
                  data-testid={TEST_IDS.cart.item(line.productId)}
                  className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <ProductImage
                      src={line.imageUrl}
                      alt={line.name}
                      className="h-20 w-20 shrink-0 object-contain p-1"
                    />
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/products/${line.productId}`}
                        className="font-semibold text-ink hover:text-accent"
                      >
                        {line.name}
                      </Link>
                      <p className="text-sm text-ink-muted">
                        {VI_MESSAGES.cart.unitPriceLabel}: {formatVnd(line.unitPriceVnd)}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        {VI_MESSAGES.cart.lineTotalLabel}: {formatVnd(line.lineTotalVnd)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Giảm số lượng ${line.name}`}
                      data-testid={TEST_IDS.cart.qtyDec(line.productId)}
                      onClick={() => actions.onDecrement(line.productId, line.quantity)}
                    >
                      -
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
                      className="min-h-9 w-16 rounded-control border border-border bg-surface-subtle px-2 text-center text-sm text-ink"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Tăng số lượng ${line.name}`}
                      data-testid={TEST_IDS.cart.qtyInc(line.productId)}
                      onClick={() => actions.onIncrement(line.productId, line.quantity)}
                    >
                      +
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={TEST_IDS.cart.remove(line.productId)}
                      onClick={() => actions.onRequestRemove(line.productId)}
                    >
                      {VI_MESSAGES.cart.removeButton}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          <aside className="lg:col-span-1">
            <Card className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.totalQuantityLabel}</span>
                <span className="font-medium text-ink">{state.totalQuantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
                <span data-testid={TEST_IDS.cart.subtotal} className="font-semibold text-ink">
                  {formatVnd(state.subtotalVnd)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
                <span data-testid={TEST_IDS.cart.shipping} className="font-medium text-ink">
                  {state.freeShipping ? (
                    <Badge variant="success">{VI_MESSAGES.common.freeShippingLabel}</Badge>
                  ) : (
                    formatVnd(state.shippingFeeVnd)
                  )}
                </span>
              </div>
              <p className="text-xs text-ink-muted">{VI_MESSAGES.cart.freeShippingHint}</p>
              <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                <span className="text-ink">{VI_MESSAGES.cart.total}</span>
                <span data-testid={TEST_IDS.cart.total} className="text-primary">
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
                {VI_MESSAGES.cart.proceedToCheckout}
              </Button>
            </Card>
          </aside>
        </div>
      )}

      <Modal
        open={state.pendingRemoveId !== null}
        title={VI_MESSAGES.cart.removeConfirmTitle}
        onClose={actions.onCancelRemove}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted">{VI_MESSAGES.cart.removeConfirmBody}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              autoFocus
              data-testid={TEST_IDS.cart.removeCancel}
              onClick={actions.onCancelRemove}
            >
              {VI_MESSAGES.common.cancel}
            </Button>
            <Button
              variant="danger"
              data-testid={TEST_IDS.cart.removeConfirm}
              onClick={actions.onConfirmRemove}
            >
              {VI_MESSAGES.common.confirm}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
