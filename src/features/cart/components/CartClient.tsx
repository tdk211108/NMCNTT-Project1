'use client';

import { CartView } from './CartView';
import { useCartController } from '../useCartController';

export function CartClient({ notice }: { notice: string | null }) {
  const vm = useCartController(notice);
  return <CartView {...vm} />;
}
