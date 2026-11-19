'use client';

import { CompareTableView } from './CompareTableView';
import { useComparePageController } from '../useComparePageController';

export function CompareClient({ rawIds }: { rawIds: string }) {
  const vm = useComparePageController(rawIds);
  return <CompareTableView {...vm} />;
}
