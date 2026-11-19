import { PerfPerPriceClient } from '@/features/perf-per-price/components/PerfPerPriceClient';

export default async function PerfPerPricePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; maxPriceVnd?: string }>;
}) {
  const { category, maxPriceVnd } = await searchParams;
  const resolvedCategory = category === 'gpu' ? 'gpu' : 'cpu';
  return (
    <PerfPerPriceClient
      category={resolvedCategory}
      maxPriceVnd={typeof maxPriceVnd === 'string' ? maxPriceVnd : undefined}
    />
  );
}
