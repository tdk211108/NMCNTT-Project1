'use client';

import { ProductDetailView } from './ProductDetailView';
import { useProductDetailController } from '../useProductDetailController';

export function ProductDetailClient({ id }: { id: string }) {
  const vm = useProductDetailController(id);
  return <ProductDetailView {...vm} />;
}
