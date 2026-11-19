'use client';

import { OrderBoardView } from './OrderBoardView';
import { useOrderBoardController } from '../useOrderBoardController';

export function OrderBoardClient({ orderId }: { orderId: string }) {
  const vm = useOrderBoardController(orderId);
  return <OrderBoardView {...vm} />;
}
