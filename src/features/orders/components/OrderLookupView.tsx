import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AeroIconBadge } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useOrderLookupController } from '../useOrderLookupController';

export type OrderLookupViewProps = ReturnType<typeof useOrderLookupController>;

export function OrderLookupView({ state, actions }: OrderLookupViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="magnifer-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.orders.lookupTitle}</h1>
      </div>

      <Card className="flex flex-col gap-3 bg-surface-subtle/85">
        <p className="text-sm text-ink-muted">{VI_MESSAGES.orders.lookupLoginBanner}</p>
        {state.isAuthenticated ? (
          <div>
            <Link href="/orders">
              <Button variant="secondary" size="sm">
                {VI_MESSAGES.orders.lookupGoToMyOrders}
              </Button>
            </Link>
          </div>
        ) : (
          <div>
            <Button variant="secondary" size="sm" onClick={actions.onOpenLogin}>
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
            className="font-mono"
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
            className="font-mono tabular-nums"
          />

          {state.errorMessage ? (
            <p
              role="alert"
              data-testid={TEST_IDS.orders.lookupError}
              className="rounded-control border border-danger/50 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
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
