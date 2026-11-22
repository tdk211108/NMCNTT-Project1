'use client';

import { useUpgradeAdvisorController, type UpgradeInitialParams } from '../useUpgradeAdvisorController';
import { UpgradeAdvisorView } from './UpgradeAdvisorView';

export function UpgradeAdvisorClient(props: UpgradeInitialParams) {
  const vm = useUpgradeAdvisorController(props);
  return <UpgradeAdvisorView {...vm} />;
}
