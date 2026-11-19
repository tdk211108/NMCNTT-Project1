'use client';

import { PsuEstimatorView } from './PsuEstimatorView';
import { usePsuController } from '../usePsuController';

export function PsuClient({ cpu, gpu }: { cpu?: string; gpu?: string }) {
  const vm = usePsuController({ cpu, gpu });
  return <PsuEstimatorView {...vm} />;
}
