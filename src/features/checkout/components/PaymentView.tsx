import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { usePaymentController } from '../usePaymentController';

export type PaymentViewProps = ReturnType<typeof usePaymentController>;

export function PaymentView({ state, actions }: PaymentViewProps) {
  if (!state.checkedStorage || state.isAuthLoading) {
    return <Spinner />;
  }

  if (!state.isAuthenticated) {
    return (
      <EmptyState
        testId={TEST_IDS.orders.checkoutAuthGate}
        title={VI_MESSAGES.orders.checkoutAuthTitle}
        description={VI_MESSAGES.orders.checkoutAuthDesc}
        action={
          <Button
            variant="primary"
            data-testid={TEST_IDS.orders.checkoutAuthLogin}
            onClick={actions.onRequestLogin}
          >
            {VI_MESSAGES.orders.checkoutAuthButton}
          </Button>
        }
      />
    );
  }

  if (!state.attempt) {
    return (
      <EmptyState
        title={VI_MESSAGES.checkout.missingAttemptNotice}
        action={
          <Link href="/cart">
            <Button variant="primary">{VI_MESSAGES.nav.cart}</Button>
          </Link>
        }
      />
    );
  }

  const { prepared } = state.attempt;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="shield-check-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.checkout.paymentTitle}</h1>
      </div>

      <Card className="border-warning/60 bg-surface-subtle text-sm font-medium text-warning">
        {VI_MESSAGES.checkout.demoPaymentBanner}
      </Card>

      {prepared.paymentMethod === 'bank_transfer' && prepared.bankInstructions ? (
        <Card className="flex flex-col items-center gap-4">
          <div className="overflow-hidden rounded-[16px] bg-white p-2.5 shadow-sm ring-1 ring-white/80 dark:ring-emerald-300/20">
            <img
              src={prepared.bankInstructions.qrImageDataUrl}
              alt="QR chuyển khoản mô phỏng"
              data-testid={TEST_IDS.checkout.paymentQrImage}
              className="h-56 w-56 object-contain"
            />
          </div>
          <dl className="grid w-full grid-cols-1 gap-3 border-t border-border/70 pt-3.5 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankNameLabel}</dt>
              <dd className="font-semibold text-ink">{prepared.bankInstructions.bankName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankAccountLabel}</dt>
              <dd className="font-mono font-semibold text-ink">{prepared.bankInstructions.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankHolderLabel}</dt>
              <dd className="font-semibold text-ink">{prepared.bankInstructions.accountHolder}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankAmountLabel}</dt>
              <dd className="font-mono font-bold tabular-nums text-primary">
                {formatVnd(prepared.bankInstructions.amountVnd)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankMemoLabel}</dt>
              <dd className="font-mono font-semibold text-primary">
                {prepared.bankInstructions.transferMemo}
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p className="font-mono text-base font-bold tabular-nums text-primary">
            {VI_MESSAGES.checkout.bankAmountLabel}: {formatVnd(prepared.quote.totalVnd)}
          </p>
          <Input
            label={VI_MESSAGES.checkout.cardNumberLabel}
            autoComplete="cc-number"
            value={state.cardNumber}
            data-testid={TEST_IDS.checkout.paymentCardNumber}
            onChange={(e) => actions.onChangeCardNumber(e.target.value)}
            className="font-mono tabular-nums"
          />
          <Input
            label={VI_MESSAGES.checkout.cardHolderLabel}
            autoComplete="cc-name"
            value={state.cardHolder}
            onChange={(e) => actions.onChangeCardHolder(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={VI_MESSAGES.checkout.cardExpiryLabel}
              autoComplete="cc-exp"
              value={state.cardExpiry}
              onChange={(e) => actions.onChangeCardExpiry(e.target.value)}
              className="font-mono tabular-nums"
            />
            <Input
              label={VI_MESSAGES.checkout.cardCvvLabel}
              autoComplete="cc-csc"
              value={state.cardCvv}
              onChange={(e) => actions.onChangeCardCvv(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>
        </Card>
      )}

      <Button
        variant="primary"
        size="lg"
        isLoading={state.isSubmitting}
        data-testid={TEST_IDS.checkout.paymentConfirm}
        onClick={actions.onConfirmPayment}
      >
        {VI_MESSAGES.checkout.paymentConfirmCompleted}
      </Button>
    </div>
  );
}
