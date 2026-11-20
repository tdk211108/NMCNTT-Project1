import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
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
  const prepared = attempt?.prepared;

  return (
    <AlertDialog open={Boolean(prepared)} dismissible={false}>
      <AlertDialogPortal>
        {prepared ? (
          <>
            <AlertDialogBackdrop />
            <AlertDialogPopup data-testid={TEST_IDS.checkout.reviewModal}>
              <AlertDialogHeader>
                <AlertDialogTitle>{VI_MESSAGES.checkout.reviewModalTitle}</AlertDialogTitle>
              </AlertDialogHeader>

              <div className="flex flex-col gap-4 text-sm">
                <p
                  data-testid={TEST_IDS.checkout.reviewCountdown}
                  className="rounded-control border border-border-strong bg-accent/12 px-3.5 py-2.5 font-mono font-semibold tabular-nums text-primary"
                >
                  {VI_MESSAGES.checkout.reviewCountdownText(Math.max(0, countdown))}
                </p>

                <div className="flex flex-col gap-1 rounded-control border border-border bg-surface-subtle/85 p-3.5 shadow-[inset_0_1px_0_var(--aero-specular)]">
                  <p className="font-bold text-ink">{prepared.customer.fullName}</p>
                  <p className="font-mono text-ink-muted">{prepared.customer.phoneMasked}</p>
                  <p className="text-ink-muted">{prepared.customer.addressLine}</p>
                  {prepared.customer.note ? (
                    <p className="text-ink-muted">{prepared.customer.note}</p>
                  ) : null}
                  <p className="mt-1 font-medium text-ink">
                    {VI_MESSAGES.checkout.paymentMethod}:{' '}
                    {VI_MESSAGES.checkout.paymentMethods[prepared.paymentMethod]}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border/70 pt-2.5">
                  {prepared.quote.lines.map((line) => (
                    <div key={line.productId} className="flex justify-between gap-2">
                      <span className="text-ink">
                        {line.name} x {line.quantity}
                      </span>
                      <span className="shrink-0 font-mono font-semibold tabular-nums text-ink">
                        {formatVnd(line.lineTotalVnd)}
                      </span>
                    </div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-border/70 pt-2.5 text-base font-bold text-ink">
                    <span>{VI_MESSAGES.cart.total}</span>
                    <span className="font-mono tabular-nums text-primary">
                      {formatVnd(prepared.quote.totalVnd)}
                    </span>
                  </div>
                </div>
              </div>

              <AlertDialogFooter>
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
              </AlertDialogFooter>
            </AlertDialogPopup>
          </>
        ) : null}
      </AlertDialogPortal>
    </AlertDialog>
  );
}
