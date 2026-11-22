'use client';

import { useComboAdvisorController, type ComboInitialParams } from '../useComboAdvisorController';
import { ComboAdvisorView } from './ComboAdvisorView';

export function ComboAdvisorClient(props: ComboInitialParams) {
  const vm = useComboAdvisorController(props);
  return <ComboAdvisorView {...vm} />;
}
