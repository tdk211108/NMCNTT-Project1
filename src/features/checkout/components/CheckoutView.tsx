import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { paymentMethodSchema } from '@/shared/schemas';
import { TEST_IDS } from '@/shared/testids';
import type { useCheckoutController } from '../useCheckoutController';
import { ReviewModal } from './ReviewModal';

export type CheckoutViewProps = ReturnType<typeof useCheckoutController>;

export function CheckoutView({ state, actions }: CheckoutViewProps) {
  if (!state.hasHydrated || state.isAuthLoading) {
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

  const { form } = state;
  const errors = form.formState.errors;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.checkout.title}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={actions.onSubmitForm} className="flex flex-col gap-4 lg:col-span-2" noValidate>
          <Card className="flex flex-col gap-4">
            <Input
              label={VI_MESSAGES.checkout.fullName}
              autoComplete="name"
              required
              data-testid={TEST_IDS.checkout.fullName}
              error={errors.fullName?.message}
              {...form.register('fullName')}
            />

            <Input
              type="tel"
              inputMode="tel"
              label={VI_MESSAGES.checkout.phone}
              autoComplete="tel"
              required
              data-testid={TEST_IDS.checkout.phone}
              error={errors.phone?.message}
              {...form.register('phone')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label={VI_MESSAGES.checkout.province}
                autoComplete="address-level1"
                required
                data-testid={TEST_IDS.checkout.province}
                error={errors.provinceCode?.message}
                value={state.selectedProvinceCode}
                onChange={(e) => actions.onProvinceChange(e.target.value)}
              >
                <option value="">{VI_MESSAGES.checkout.selectProvincePlaceholder}</option>
                {state.provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </Select>

              <Select
                label={VI_MESSAGES.checkout.ward}
                autoComplete="address-level2"
                required
                disabled={!state.selectedProvinceCode || state.isLoadingWards}
                data-testid={TEST_IDS.checkout.ward}
                error={errors.wardCode?.message}
                {...form.register('wardCode')}
              >
                <option value="">{VI_MESSAGES.checkout.selectWardPlaceholder}</option>
                {state.wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label={VI_MESSAGES.checkout.streetAddress}
              autoComplete="street-address"
              required
              data-testid={TEST_IDS.checkout.street}
              error={errors.streetAddress?.message}
              {...form.register('streetAddress')}
            />

            <Input
              label={VI_MESSAGES.checkout.note}
              data-testid={TEST_IDS.checkout.note}
              error={errors.note?.message}
              {...form.register('note')}
            />
          </Card>

          <Card>
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-2 text-sm font-semibold text-ink">
                {VI_MESSAGES.checkout.paymentMethod}
              </legend>
              {paymentMethodSchema.options.map((method) => (
                <label
                  key={method}
                  className="flex cursor-pointer items-center gap-3 rounded-control border border-border bg-surface-subtle px-3 py-2.5 text-sm text-ink"
                >
                  <input
                    type="radio"
                    value={method}
                    data-testid={TEST_IDS.checkout.payment(method)}
                    {...form.register('paymentMethod')}
                    className="h-4 w-4 accent-accent"
                  />
                  <span>{VI_MESSAGES.checkout.paymentMethods[method]}</span>
                </label>
              ))}
            </fieldset>
          </Card>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={state.isPreparing}
            data-testid={TEST_IDS.checkout.submit}
          >
            {VI_MESSAGES.checkout.submitOrder}
          </Button>
        </form>

        <aside className="lg:col-span-1">
          <Card className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-ink">{VI_MESSAGES.orders.summaryHeading}</h2>
            {state.quote ? (
              <>
                <div className="flex flex-col gap-2 border-b border-border pb-3 text-sm">
                  {state.quote.lines.map((line) => (
                    <div key={line.productId} className="flex justify-between gap-2">
                      <span className="text-ink-muted">
                        {line.name} x {line.quantity}
                      </span>
                      <span className="shrink-0 font-medium text-ink">
                        {formatVnd(line.lineTotalVnd)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
                  <span className="font-medium text-ink">
                    {formatVnd(state.quote.subtotalVnd)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
                  <span className="font-medium text-ink">
                    {state.quote.freeShipping ? (
                      <Badge variant="success">{VI_MESSAGES.common.freeShippingLabel}</Badge>
                    ) : (
                      formatVnd(state.quote.shippingFeeVnd)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
                  <span className="text-ink">{VI_MESSAGES.cart.total}</span>
                  <span className="text-primary">{formatVnd(state.quote.totalVnd)}</span>
                </div>
              </>
            ) : (
              <Spinner />
            )}
          </Card>
        </aside>
      </div>

      <ReviewModal
        attempt={state.reviewAttempt}
        countdown={state.countdown}
        isSubmitting={state.isSubmittingOrder}
        onCancel={actions.onCancelReview}
        onConfirmNow={actions.onConfirmReviewNow}
      />
    </div>
  );
}
