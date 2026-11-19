'use client';

import { HomeView } from './HomeView';
import { useHomeController } from '../useHomeController';

export function HomeClient() {
  const vm = useHomeController();
  return <HomeView {...vm} />;
}
