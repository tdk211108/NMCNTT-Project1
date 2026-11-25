import type { OrderBoard } from '@/shared/types';

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
