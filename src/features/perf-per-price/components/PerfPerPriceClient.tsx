'use client';

import type { Category } from '@/shared/types';
import { PerfPerPriceView } from './PerfPerPriceView';
import { usePerfPerPriceController } from '../usePerfPerPriceController';

export function PerfPerPriceClient({ category }: { category: Category }) {
  const vm = usePerfPerPriceController({ category });
  return <PerfPerPriceView {...vm} />;
}
