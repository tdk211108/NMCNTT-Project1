import type { Metadata } from 'next';
import { PerfPerPriceClient } from '@/features/perf-per-price/components/PerfPerPriceClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.tools.perfPerPrice.title,
  description: VI_MESSAGES.home.pppShortcutDesc,
});

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
