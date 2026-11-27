import { Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { StoredCheckoutAttempt } from '../attempt-storage';

export interface ReviewModalProps {
  attempt: StoredCheckoutAttempt | null;
  countdown: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirmNow: () => void;
}

export function ReviewModal({
  attempt,
  countdown,
  isSubmitting,
  onCancel,
  onConfirmNow,
}: ReviewModalProps) {
  if (!attempt) {
    return null;
  }

  const { prepared } = attempt;

  return (
    <Modal
      open={Boolean(attempt)}
      title={VI_MESSAGES.checkout.reviewModalTitle}
      dismissible={false}
      testId={TEST_IDS.checkout.reviewModal}
    >
      <div className="flex flex-col gap-4 text-sm">
        <p
          data-testid={TEST_IDS.checkout.reviewCountdown}
          className="rounded-control border-2 border-signal bg-surface-subtle px-3 py-2 font-mono font-semibold tabular-nums text-accent-ink"
        >
          {VI_MESSAGES.checkout.reviewCountdownText(Math.max(0, countdown))}
        </p>

        <div className="flex flex-col gap-1 rounded-control border-2 border-border-strong bg-surface-subtle p-3">
          <p className="font-semibold text-ink">{prepared.customer.fullName}</p>
          <p className="font-mono tabular-nums text-ink-muted">{prepared.customer.phoneMasked}</p>
          <p className="text-ink-muted">{prepared.customer.addressLine}</p>
          {prepared.customer.note ? (
            <p className="text-ink-muted">{prepared.customer.note}</p>
          ) : null}
          <p className="mt-1 text-ink">
            {VI_MESSAGES.checkout.paymentMethod}:{' '}
            {VI_MESSAGES.checkout.paymentMethods[prepared.paymentMethod]}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 border-t-2 border-border pt-2">
          {prepared.quote.lines.map((line) => (
            <div key={line.productId} className="flex justify-between gap-2">
              <span className="text-ink">
                {line.name} x {line.quantity}
              </span>
              <span className="shrink-0 font-mono font-medium tabular-nums text-ink">
                {formatVnd(line.lineTotalVnd)}
              </span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-border pt-2">
            <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
            <span
              data-testid={TEST_IDS.checkout.reviewSubtotal}
              className="font-mono font-medium tabular-nums text-ink"
            >
              {formatVnd(prepared.quote.subtotalVnd)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
            <span
              data-testid={TEST_IDS.checkout.reviewShipping}
              className="font-mono font-medium tabular-nums text-ink"
            >
              {prepared.quote.freeShipping ? (
                <Badge variant="success">{VI_MESSAGES.common.freeShippingLabel}</Badge>
              ) : (
                formatVnd(prepared.quote.shippingFeeVnd)
              )}
            </span>
          </div>
          <div className="mt-1 flex justify-between border-t-2 border-border pt-2 font-bold text-ink">
            <span>{VI_MESSAGES.cart.total}</span>
            <span
              data-testid={TEST_IDS.checkout.reviewTotal}
              className="font-mono tabular-nums text-accent-ink"
            >
              {formatVnd(prepared.quote.totalVnd)}
            </span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            disabled={isSubmitting}
            data-testid={TEST_IDS.checkout.reviewCancel}
            onClick={onCancel}
          >
            {VI_MESSAGES.checkout.reviewCancelEdit}
          </Button>
          <Button
            variant="primary"
            isLoading={isSubmitting}
            data-testid={TEST_IDS.checkout.reviewConfirmNow}
            onClick={onConfirmNow}
          >
            {VI_MESSAGES.checkout.reviewConfirmNow}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
