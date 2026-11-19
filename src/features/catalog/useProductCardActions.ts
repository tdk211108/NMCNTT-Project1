'use client';

import { useRouter } from 'next/navigation';
import { useCartStore } from '@/features/cart/store';
import type { ProductCard } from '@/shared/types';

export function useProductCardActions() {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);

  return {
    onBuyNow: (product: ProductCard) => {
      const added = addToCart({
        productId: product.id,
        unitPriceVnd: product.priceVnd,
      });
      if (added) {
        router.push('/cart');
      }
    },
    onAddToCart: (product: ProductCard) =>
      addToCart({
        productId: product.id,
        name: product.name,
        unitPriceVnd: product.priceVnd,
      }),
    onCompare: (product: ProductCard) => {
      router.push(`/compare?ids=${encodeURIComponent(product.id)}`);
    },
  };
}
