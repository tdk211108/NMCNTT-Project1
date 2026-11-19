import type { Metadata } from 'next';
import { OrderBoardClient } from '@/features/orders/components/OrderBoardClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.orders.boardTitle,
  noIndex: true,
});

export default async function OrderBoardPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderBoardClient orderId={orderId} />;
}
