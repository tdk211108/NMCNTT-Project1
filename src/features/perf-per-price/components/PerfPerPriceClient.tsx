'use client';

import type { Category } from '@/shared/types';
import { PerfPerPriceView } from './PerfPerPriceView';
import { usePerfPerPriceController } from '../usePerfPerPriceController';

export function PerfPerPriceClient({
  category,
  maxPriceVnd,
}: {
  category: Category;
  maxPriceVnd?: string;
}) {
  const vm = usePerfPerPriceController({ category, maxPriceVnd });
  return <PerfPerPriceView {...vm} />;
}
