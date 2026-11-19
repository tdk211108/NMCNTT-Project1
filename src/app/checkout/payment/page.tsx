import type { Metadata } from 'next';
import { PaymentClient } from '@/features/checkout/components/PaymentClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.checkout.paymentTitle,
  noIndex: true,
});

export default function PaymentPage() {
  return <PaymentClient />;
}
