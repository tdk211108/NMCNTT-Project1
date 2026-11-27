import { describe, expect, it } from 'vitest';
import { computeProfileOrderStats } from '@/server/domain/profile-stats';

describe('domain/profile-stats', () => {
  it('returns zeroed metrics when customer has no orders', () => {
    expect(computeProfileOrderStats([])).toEqual({
      totalOrders: 0,
      completedOrders: 0,
      activeOrders: 0,
      cancelledOrders: 0,
      totalSpentVnd: 0,
      completedSpentVnd: 0,
      totalItemsPurchased: 0,
    });
  });

  it('aggregates active, completed, and cancelled orders while excluding cancelled totals', () => {
    const rows = [
      { statusStage: 0, cancelledAt: null, totalVnd: 5_050_000, totalQuantity: 1 },
      { statusStage: 2, cancelledAt: null, totalVnd: 12_000_000, totalQuantity: 2 },
      { statusStage: 4, cancelledAt: null, totalVnd: 30_000_000, totalQuantity: 3 },
      {
        statusStage: 0,
        cancelledAt: new Date('2026-11-26T10:00:00Z'),
        totalVnd: 9_999_000,
        totalQuantity: 4,
      },
    ];

    expect(computeProfileOrderStats(rows)).toEqual({
      totalOrders: 4,
      completedOrders: 1,
      activeOrders: 2,
      cancelledOrders: 1,
      totalSpentVnd: 47_050_000,
      completedSpentVnd: 30_000_000,
      totalItemsPurchased: 6,
    });
  });
});
