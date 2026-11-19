'use client';

import { usePaymentController } from '../usePaymentController';
import { PaymentView } from './PaymentView';

export function PaymentClient() {
  const vm = usePaymentController();
  return <PaymentView {...vm} />;
}
