import type { Metadata } from 'next';
import { OrderLookupClient } from '@/features/orders/components/OrderLookupClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.orders.lookupTitle,
  noIndex: true,
});

export default function OrderLookupPage() {
  return <OrderLookupClient />;
}
