import Link from 'next/link';
import { AnimatedCopyButton } from '@/components/ui/AnimatedCopyButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { formatVnd } from '@/lib/format';
import { OrderStatusModal } from '@/features/orders/components/OrderStatusModal';
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
    if (state.placedOrderModal.placedOrder || state.placedOrderModal.hasCompletedOrder) {
      return (
        <>
          <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
            <h1 className="font-display text-2xl font-bold text-ink">
              {VI_MESSAGES.orders.placedModalTitle}
            </h1>
            <Card className="border-success bg-highlight text-sm font-medium text-highlight-fg">
              {VI_MESSAGES.orders.placedModalSubtitle}
            </Card>
          </div>
          <OrderStatusModal
            placedOrder={state.placedOrderModal.placedOrder}
            isAdvancing={state.placedOrderModal.isAdvancing}
            onCopyOrderId={actions.placedOrderActions.onCopyOrderId}
            onAdvanceStage={actions.placedOrderActions.onAdvanceStage}
            onContinueShopping={actions.placedOrderActions.onContinueShopping}
            onViewMyOrders={actions.placedOrderActions.onViewMyOrders}
            onClose={actions.placedOrderActions.onClose}
          />
        </>
      );
    }

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
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.cart.title, href: '/cart' },
          { label: VI_MESSAGES.checkout.title, href: '/checkout' },
          { label: VI_MESSAGES.checkout.paymentTitle, href: '/checkout/payment' },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.checkout.paymentTitle}</h1>

      <Card className="border-warning bg-surface-subtle text-sm text-warning">
        {VI_MESSAGES.checkout.demoPaymentBanner}
      </Card>

      {prepared.paymentMethod === 'bank_transfer' && prepared.bankInstructions ? (
        <Card className="flex flex-col items-center gap-4">
          <img
            src={prepared.bankInstructions.qrImageDataUrl}
            alt="QR chuyển khoản mô phỏng"
            data-testid={TEST_IDS.checkout.paymentQrImage}
            className="h-56 w-56 rounded-control border-2 border-border-strong bg-white p-2"
          />
          <dl className="grid w-full grid-cols-1 gap-2 border-t-2 border-border pt-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankNameLabel}</dt>
              <dd className="font-semibold text-ink">{prepared.bankInstructions.bankName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankAccountLabel}</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-mono font-semibold tabular-nums text-ink">
                <span>{prepared.bankInstructions.accountNumber}</span>
                <AnimatedCopyButton
                  textToCopy={prepared.bankInstructions.accountNumber}
                  ariaLabel={`${VI_MESSAGES.common.copyAction} ${VI_MESSAGES.checkout.bankAccountLabel}`}
                  testId={TEST_IDS.checkout.paymentCopyAccount}
                />
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankHolderLabel}</dt>
              <dd className="font-semibold text-ink">{prepared.bankInstructions.accountHolder}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankAmountLabel}</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-mono font-bold tabular-nums text-accent-ink">
                <span>{formatVnd(prepared.bankInstructions.amountVnd)}</span>
                <AnimatedCopyButton
                  textToCopy={String(prepared.bankInstructions.amountVnd)}
                  ariaLabel={`${VI_MESSAGES.common.copyAction} ${VI_MESSAGES.checkout.bankAmountLabel}`}
                  testId={TEST_IDS.checkout.paymentCopyAmount}
                />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-ink-muted">{VI_MESSAGES.checkout.bankMemoLabel}</dt>
              <dd className="mt-0.5 flex items-center justify-between gap-2 font-mono font-semibold text-accent-ink">
                <span className="break-all">{prepared.bankInstructions.transferMemo}</span>
                <AnimatedCopyButton
                  textToCopy={prepared.bankInstructions.transferMemo}
                  ariaLabel={`${VI_MESSAGES.common.copyAction} ${VI_MESSAGES.checkout.bankMemoLabel}`}
                  testId={TEST_IDS.checkout.paymentCopyMemo}
                />
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <p className="font-mono text-base font-bold tabular-nums text-accent-ink">
            {VI_MESSAGES.checkout.bankAmountLabel}: {formatVnd(prepared.quote.totalVnd)}
          </p>
          <Input
            label={VI_MESSAGES.checkout.cardNumberLabel}
            autoComplete="cc-number"
            value={state.cardNumber}
            data-testid={TEST_IDS.checkout.paymentCardNumber}
            onChange={(e) => actions.onChangeCardNumber(e.target.value)}
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
            />
            <Input
              label={VI_MESSAGES.checkout.cardCvvLabel}
              autoComplete="cc-csc"
              value={state.cardCvv}
              onChange={(e) => actions.onChangeCardCvv(e.target.value)}
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

      <OrderStatusModal
        placedOrder={state.placedOrderModal.placedOrder}
        isAdvancing={state.placedOrderModal.isAdvancing}
        onCopyOrderId={actions.placedOrderActions.onCopyOrderId}
        onAdvanceStage={actions.placedOrderActions.onAdvanceStage}
        onContinueShopping={actions.placedOrderActions.onContinueShopping}
        onViewMyOrders={actions.placedOrderActions.onViewMyOrders}
        onClose={actions.placedOrderActions.onClose}
      />
    </div>
  );
}
