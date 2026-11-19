'use client';

import { useOrderLookupController } from '../useOrderLookupController';
import { OrderLookupView } from './OrderLookupView';

export function OrderLookupClient() {
  const vm = useOrderLookupController();
  return <OrderLookupView {...vm} />;
}
