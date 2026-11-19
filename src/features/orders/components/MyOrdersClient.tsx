'use client';

import { useMyOrdersController } from '../useMyOrdersController';
import { MyOrdersView } from './MyOrdersView';

export function MyOrdersClient() {
  const vm = useMyOrdersController();
  return <MyOrdersView {...vm} />;
}
