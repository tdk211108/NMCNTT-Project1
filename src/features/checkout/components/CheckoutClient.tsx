'use client';

import { useCheckoutController } from '../useCheckoutController';
import { CheckoutView } from './CheckoutView';

export function CheckoutClient() {
  const vm = useCheckoutController();
  return <CheckoutView {...vm} />;
}
