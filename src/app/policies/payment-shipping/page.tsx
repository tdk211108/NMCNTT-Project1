import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import { formatVnd } from '@/lib/format';
import { buildPageMetadata } from '@/lib/metadata';
import { FREE_SHIPPING_MIN_QTY, STANDARD_SHIPPING_FEE_VND } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.policies.paymentShippingTitle,
  description: VI_MESSAGES.policies.paymentShippingBody,
});

export default function PaymentShippingPolicyPage() {
  return (
    <PolicyLayout
      activePath="/policies/payment-shipping"
      title={VI_MESSAGES.policies.paymentShippingTitle}
    >
      <Card className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.paymentShippingBody}</p>
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 font-medium text-ink-muted">
                {VI_MESSAGES.policies.shippingFeeUnderMinRow(FREE_SHIPPING_MIN_QTY)}
              </th>
              <td className="px-3 py-2 font-mono tabular-nums text-ink">
                {formatVnd(STANDARD_SHIPPING_FEE_VND)}
              </td>
            </tr>
            <tr>
              <th className="bg-surface-subtle px-3 py-2 font-medium text-ink-muted">
                {VI_MESSAGES.policies.shippingFeeFromMinRow(FREE_SHIPPING_MIN_QTY)}
              </th>
              <td className="px-3 py-2 font-semibold text-success">
                {VI_MESSAGES.common.freeShippingLabel}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-ink-muted">{VI_MESSAGES.policies.paymentShippingDetails}</p>
      </Card>
    </PolicyLayout>
  );
}
