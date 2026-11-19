'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { useCartStore } from '@/features/cart/store';
import type { ProductDetail } from '@/shared/types';

export function useProductDetailController(id: string) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);

  const detailQuery = useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => apiFetch<ProductDetail>(`/api/products/${encodeURIComponent(id)}`),
    enabled: Boolean(id),
  });

  const detail = detailQuery.data ?? null;

  return {
    state: {
      detail,
      isLoading: detailQuery.isLoading,
      errorMessage: detailQuery.error?.message ?? null,
    },
    actions: {
      onBuyNow: () => {
        if (!detail) return;
        const added = addToCart({
          productId: detail.id,
          unitPriceVnd: detail.priceVnd,
        });
        if (added) {
          router.push('/cart');
        }
      },
      onAddToCart: () => {
        if (!detail) return;
        addToCart({
          productId: detail.id,
          name: detail.name,
          unitPriceVnd: detail.priceVnd,
        });
      },
      onCompare: () => {
        if (!detail) return;
        router.push(`/compare?ids=${encodeURIComponent(detail.id)}`);
      },
      onCalculatePsu: () => {
        if (!detail) return;
        const params = new URLSearchParams();
        if (detail.psuPrefill.cpu) params.set('cpu', detail.psuPrefill.cpu);
        if (detail.psuPrefill.gpu) params.set('gpu', detail.psuPrefill.gpu);
        router.push(`/tools/psu?${params.toString()}`);
      },
    },
  };
}
