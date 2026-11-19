import type { Metadata } from 'next';
import { CheckoutClient } from '@/features/checkout/components/CheckoutClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.checkout.title,
  noIndex: true,
});

export default function CheckoutPage() {
  return <CheckoutClient />;
}
