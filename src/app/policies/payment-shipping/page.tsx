import { Card } from '@/components/ui/Card';
import { formatVnd } from '@/lib/format';
import { FREE_SHIPPING_MIN_QTY, STANDARD_SHIPPING_FEE_VND } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';

export default function PaymentShippingPolicyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.policies.paymentShippingTitle}</h1>
      <Card className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.paymentShippingBody}</p>
        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 font-medium text-ink-muted">
                Đơn có dưới {FREE_SHIPPING_MIN_QTY} sản phẩm
              </th>
              <td className="px-3 py-2 text-ink">{formatVnd(STANDARD_SHIPPING_FEE_VND)}</td>
            </tr>
            <tr>
              <th className="bg-surface-subtle px-3 py-2 font-medium text-ink-muted">
                Đơn có từ {FREE_SHIPPING_MIN_QTY} sản phẩm trở lên
              </th>
              <td className="px-3 py-2 font-semibold text-success">
                {VI_MESSAGES.common.freeShippingLabel}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-ink-muted">{VI_MESSAGES.policies.paymentShippingDetails}</p>
      </Card>
    </div>
  );
}
