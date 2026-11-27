import 'server-only';

import type { ProfileOrderStats } from '@/shared/types';

export interface ProfileOrderStatRow {
  statusStage: number;
  cancelledAt: Date | null;
  totalVnd: number;
  totalQuantity: number;
}

/**
 * Pure aggregation for a customer's order metrics shown on `/profile`.
 * Cancelled orders are excluded from total spent and purchased item count.
 */
export function computeProfileOrderStats(rows: readonly ProfileOrderStatRow[]): ProfileOrderStats {
  let completedOrders = 0;
  let activeOrders = 0;
  let cancelledOrders = 0;
  let totalSpentVnd = 0;
  let completedSpentVnd = 0;
  let totalItemsPurchased = 0;

  for (const row of rows) {
    if (row.cancelledAt !== null) {
      cancelledOrders += 1;
      continue;
    }

    totalSpentVnd += row.totalVnd;
    totalItemsPurchased += row.totalQuantity;

    if (row.statusStage === 4) {
      completedOrders += 1;
      completedSpentVnd += row.totalVnd;
    } else {
      activeOrders += 1;
    }
  }

  return {
    totalOrders: rows.length,
    completedOrders,
    activeOrders,
    cancelledOrders,
    totalSpentVnd,
    completedSpentVnd,
    totalItemsPurchased,
  };
}
