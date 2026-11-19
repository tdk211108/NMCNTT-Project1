import type { Metadata } from 'next';
import { ProductDetailClient } from '@/features/product-detail/components/ProductDetailClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.catalog.productDetailMetaTitle,
  description: VI_MESSAGES.home.heroSubtitle,
});

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailClient id={id} />;
}
