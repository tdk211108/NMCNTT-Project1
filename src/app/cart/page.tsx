import { CartClient } from '@/features/cart/components/CartClient';

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return <CartClient notice={typeof notice === 'string' ? notice : null} />;
}
