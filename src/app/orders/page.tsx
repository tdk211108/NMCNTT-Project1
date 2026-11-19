'use client';

import { MyOrdersView } from '@/features/orders/components/MyOrdersView';
import { useMyOrdersController } from '@/features/orders/useMyOrdersController';

export default function MyOrdersPage() {
  const vm = useMyOrdersController();
  return <MyOrdersView {...vm} />;
}
