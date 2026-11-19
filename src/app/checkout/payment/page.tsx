'use client';

import { PaymentView } from '@/features/checkout/components/PaymentView';
import { usePaymentController } from '@/features/checkout/usePaymentController';

export default function PaymentPage() {
  const vm = usePaymentController();
  return <PaymentView {...vm} />;
}
