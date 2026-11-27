import 'server-only';

import { eq } from 'drizzle-orm';
import type { OrderBoard } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { orders, users } from '../db/schema';
import { sendEmail, type EmailSender } from './resend';
import {
  buildOrderDeliveredEmailTemplate,
  buildOrderPlacedEmailTemplate,
} from './templates';

export function resolveSiteUrl(): string {
  return (
    (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '') ||
    'https://coreraster.me'
  );
}

/**
 * Best-effort async notification after a newly created customer order.
 * Never throws so checkout success is independent of email transport.
 */
export async function notifyOrderPlacedIfPossible(
  order: OrderBoard,
  userId: string | null,
  db: DbClient = getDb(),
  sender: EmailSender = sendEmail,
): Promise<void> {
  if (!userId) {
    return;
  }
  try {
    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!owner?.email) {
      return;
    }

    const template = buildOrderPlacedEmailTemplate({
      order,
      siteUrl: resolveSiteUrl(),
    });
    await sender({ to: owner.email, ...template });
  } catch (error) {
    console.error('[email/order-placed] failed:', error);
  }
}

/**
 * Best-effort async notification when an order transitions to stage 4 (Delivered).
 * Never throws so order progression is independent of email transport.
 */
export async function notifyOrderDeliveredIfPossible(
  order: OrderBoard,
  db: DbClient = getDb(),
  sender: EmailSender = sendEmail,
): Promise<void> {
  try {
    const [row] = await db
      .select({ email: users.email })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, order.orderId))
      .limit(1);

    if (!row?.email) {
      return;
    }

    const template = buildOrderDeliveredEmailTemplate({
      order,
      siteUrl: resolveSiteUrl(),
    });
    await sender({ to: row.email, ...template });
  } catch (error) {
    console.error('[email/order-delivered] failed:', error);
  }
}
