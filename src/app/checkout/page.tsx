'use client';

import { CheckoutView } from '@/features/checkout/components/CheckoutView';
import { useCheckoutController } from '@/features/checkout/useCheckoutController';

export default function CheckoutPage() {
  const vm = useCheckoutController();
  return <CheckoutView {...vm} />;
}
