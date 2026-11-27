import type { QueryClient } from '@tanstack/react-query';
import type { OrderBoard } from '@/shared/types';

/** Invalidates cached customer, profile, and admin order lists after any order mutation. */
export function invalidateOrderLists(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] });
  void queryClient.invalidateQueries({ queryKey: ['profile'] });
  void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
}

/** Optimistically advances an order board from stage 3 to delivered (stage 4) while awaiting DB sync. */
export function createOptimisticDeliveredBoard(
  board: OrderBoard,
  nowIso: string = new Date().toISOString(),
): OrderBoard {
  return {
    ...board,
    stage: 4,
    isCompleted: true,
    stages: board.stages.map((entry) =>
      entry.stage === 4 ? { ...entry, reachedAt: entry.reachedAt ?? nowIso } : entry,
    ),
  };
}
