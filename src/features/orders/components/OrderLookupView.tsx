import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useOrderLookupController } from '../useOrderLookupController';

export type OrderLookupViewProps = ReturnType<typeof useOrderLookupController>;

export function OrderLookupView({ state, actions }: OrderLookupViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.orders.lookupTitle, href: '/orders/lookup' },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.orders.lookupTitle}</h1>

      <Card className="flex flex-col gap-3 bg-surface-subtle">
        <p className="text-sm text-ink-muted">{VI_MESSAGES.orders.lookupLoginBanner}</p>
        {state.isAuthenticated ? (
          <div>
            <Link href="/orders">
              <Button variant="outline" size="sm">
                {VI_MESSAGES.orders.lookupGoToMyOrders}
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <Button variant="outline" size="sm" onClick={actions.onOpenLogin}>
              {VI_MESSAGES.nav.login}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await actions.onSubmit();
            } catch {
              // Error shown via state.errorMessage.
            }
          }}
          className="flex flex-col gap-4"
        >
          <Input
            label={VI_MESSAGES.orders.lookupOrderIdLabel}
            required
            autoComplete="off"
            value={state.orderId}
            data-testid={TEST_IDS.orders.lookupOrderId}
            onChange={(e) => actions.onChangeOrderId(e.target.value)}
          />
          <Input
            type="tel"
            inputMode="tel"
            label={VI_MESSAGES.orders.lookupPhoneLabel}
            required
            autoComplete="tel"
            value={state.phone}
            data-testid={TEST_IDS.orders.lookupPhone}
            onChange={(e) => actions.onChangePhone(e.target.value)}
          />

          {state.errorMessage ? (
            <p
              role="alert"
              data-testid={TEST_IDS.orders.lookupError}
              className="rounded-control border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {state.errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={state.isSubmitting}
            data-testid={TEST_IDS.orders.lookupSubmit}
          >
            {VI_MESSAGES.orders.lookupSubmit}
          </Button>
        </form>
      </Card>
    </div>
  );
}
