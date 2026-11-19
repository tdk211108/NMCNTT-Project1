import { OrderBoardClient } from '@/features/orders/components/OrderBoardClient';

export default async function OrderBoardPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <OrderBoardClient orderId={orderId} />;
}
