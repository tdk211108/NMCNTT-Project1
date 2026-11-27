import 'server-only';

import { desc, eq } from 'drizzle-orm';
import { MY_ORDERS_MAX_ROWS } from '@/shared/constants';
import type { UserProfileResponse } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { oauthAccounts, orders, users } from '../db/schema';
import { computeProfileOrderStats } from '../domain/profile-stats';
import { AppError } from '../http/errors';
import { mapCustomerOrderSummary } from './order.service';

export async function getUserProfile(
  userId: string,
  db: DbClient = getDb(),
): Promise<UserProfileResponse> {
  const [userRow] = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) {
    throw new AppError('UNAUTHORIZED');
  }

  // shortcut: scans all user orders in memory; switch to SQL COUNT/SUM if per-user order counts grow beyond thousands.
  const [oauthRows, orderRows] = await Promise.all([
    db
      .select({ provider: oauthAccounts.provider })
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId)),
    db
      .select({
        id: orders.id,
        customerName: orders.customerName,
        totalQuantity: orders.totalQuantity,
        totalVnd: orders.totalVnd,
        statusStage: orders.statusStage,
        cancelledAt: orders.cancelledAt,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt)),
  ]);

  const linkedProviders = [...new Set(oauthRows.map((row) => row.provider))];

  return {
    profile: {
      id: userRow.id,
      username: userRow.username,
      displayName: userRow.displayName,
      email: userRow.email,
      emailVerified: Boolean(userRow.email && userRow.emailVerifiedAt),
      avatarUrl: userRow.avatarUrl,
      hasPassword: Boolean(userRow.passwordHash),
      linkedProviders,
      createdAt: userRow.createdAt.toISOString(),
    },
    stats: computeProfileOrderStats(orderRows),
    orders: orderRows.slice(0, MY_ORDERS_MAX_ROWS).map(mapCustomerOrderSummary),
  };
}
