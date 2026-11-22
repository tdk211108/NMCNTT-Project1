import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { SearchableSelect, type SearchableSelectGroup } from '@/components/ui/SearchableSelect';
import { formatVnd } from '@/lib/format';
import { OrderStatusModal } from '@/features/orders/components/OrderStatusModal';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { paymentMethodSchema } from '@/shared/schemas';
import { TEST_IDS } from '@/shared/testids';
import type { AddressOption } from '@/shared/types';
import type { useCheckoutController } from '../useCheckoutController';
import { ReviewModal } from './ReviewModal';

export type CheckoutViewProps = ReturnType<typeof useCheckoutController>;

function buildAddressGroups(
  id: string,
  label: string,
  items: readonly AddressOption[],
): SearchableSelectGroup[] {
  if (items.length === 0) return [];
  return [
    {
      id,
      label,
      options: items.map((item) => ({
        value: item.code,
        label: item.name,
        keywords: item.code,
      })),
    },
  ];
}

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
  const provinceGroups = buildAddressGroups('provinces', VI_MESSAGES.checkout.province, state.provinces);
  const wardGroups = buildAddressGroups('wards', VI_MESSAGES.checkout.ward, state.wards);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.cart.title, href: '/cart' },
          { label: VI_MESSAGES.checkout.title, href: '/checkout' },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.checkout.title}</h1>

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
              <SearchableSelect
                label={VI_MESSAGES.checkout.province}
                value={state.selectedProvinceCode}
                groups={provinceGroups}
                placeholder={VI_MESSAGES.checkout.selectProvincePlaceholder}
                searchPlaceholder={VI_MESSAGES.checkout.searchProvincePlaceholder}
                required
                error={errors.provinceCode?.message}
                triggerTestId={TEST_IDS.checkout.province}
                searchTestId={TEST_IDS.checkout.provinceSearch}
                optionTestId={TEST_IDS.checkout.provinceOption}
                onChange={actions.onProvinceChange}
              />

              <SearchableSelect
                label={VI_MESSAGES.checkout.ward}
                value={state.selectedWardCode}
                groups={wardGroups}
                placeholder={
                  state.isLoadingWards
                    ? VI_MESSAGES.checkout.loadingWardsPlaceholder
                    : VI_MESSAGES.checkout.selectWardPlaceholder
                }
                searchPlaceholder={VI_MESSAGES.checkout.searchWardPlaceholder}
                required
                disabled={!state.selectedProvinceCode || state.isLoadingWards}
                error={errors.wardCode?.message}
                triggerTestId={TEST_IDS.checkout.ward}
                searchTestId={TEST_IDS.checkout.wardSearch}
                optionTestId={TEST_IDS.checkout.wardOption}
                onChange={actions.onWardChange}
              />
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
                  className="flex cursor-pointer items-center gap-3 rounded-control border-2 border-border-strong bg-surface-subtle px-3 py-2.5 text-sm font-medium text-ink"
                >
                  <input
                    type="radio"
                    value={method}
                    data-testid={TEST_IDS.checkout.payment(method)}
                    {...form.register('paymentMethod')}
                    className="h-4 w-4"
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
            <h2 className="font-display text-base font-bold text-ink">{VI_MESSAGES.orders.summaryHeading}</h2>
            {state.quote ? (
              <>
                <div className="flex flex-col gap-2.5 border-b-2 border-border pb-3 text-sm">
                  {state.quote.lines.map((line) => (
                    <div key={line.productId} className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ProductImage
                          src={line.imageUrl}
                          alt={line.name}
                          className="h-11 w-11 shrink-0 border border-border-strong object-contain p-0.5"
                        />
                        <span className="line-clamp-2 text-ink-muted">
                          {line.name} x {line.quantity}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono font-medium tabular-nums text-ink">
                        {formatVnd(line.lineTotalVnd)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">{VI_MESSAGES.cart.subtotal}</span>
                  <span className="font-mono font-medium tabular-nums text-ink">
                    {formatVnd(state.quote.subtotalVnd)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{VI_MESSAGES.cart.shippingFee}</span>
                  <span className="font-mono font-medium tabular-nums text-ink">
                    {state.quote.freeShipping ? (
                      <Badge variant="success">{VI_MESSAGES.common.freeShippingLabel}</Badge>
                    ) : (
                      formatVnd(state.quote.shippingFeeVnd)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t-2 border-border pt-3 text-base font-bold">
                  <span className="text-ink">{VI_MESSAGES.cart.total}</span>
                  <span className="font-mono tabular-nums text-accent-ink">
                    {formatVnd(state.quote.totalVnd)}
                  </span>
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
