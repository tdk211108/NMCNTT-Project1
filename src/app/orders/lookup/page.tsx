'use client';

import { OrderLookupView } from '@/features/orders/components/OrderLookupView';
import { useOrderLookupController } from '@/features/orders/useOrderLookupController';

export default function OrderLookupPage() {
  const vm = useOrderLookupController();
  return <OrderLookupView {...vm} />;
}
