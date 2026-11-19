import type { Metadata } from 'next';
import { MyOrdersClient } from '@/features/orders/components/MyOrdersClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.orders.myOrdersTitle,
  noIndex: true,
});

export default function MyOrdersPage() {
  return <MyOrdersClient />;
}
