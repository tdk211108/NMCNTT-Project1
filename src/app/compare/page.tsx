import { CompareClient } from '@/features/compare/components/CompareClient';

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  return <CompareClient rawIds={typeof ids === 'string' ? ids : ''} />;
}
