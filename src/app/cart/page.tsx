import type { Metadata } from 'next';
import { CartClient } from '@/features/cart/components/CartClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.cart.title,
  noIndex: true,
});

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return <CartClient notice={typeof notice === 'string' ? notice : null} />;
}
