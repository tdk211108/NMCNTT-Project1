import 'server-only';

import { desc } from 'drizzle-orm';
import { ADMIN_ORDERS_MAX_ROWS } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { AdminOrderListItem, OrderBoard, OrderStage } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { orders } from '../db/schema';
import { AppError } from '../http/errors';
import { loadOrderBoard } from './order.service';

export async function listAdminOrders(db: DbClient = getDb()): Promise<AdminOrderListItem[]> {
  const rows = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      phone: orders.phone,
      totalVnd: orders.totalVnd,
      statusStage: orders.statusStage,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(ADMIN_ORDERS_MAX_ROWS);

  return rows.map((row) => {
    const stage = row.statusStage as OrderStage;
    return {
      orderId: row.id,
      customerName: row.customerName,
      phone: row.phone,
      totalVnd: row.totalVnd,
      stage,
      stageLabel: VI_MESSAGES.orders.stages[stage],
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export async function getAdminOrderDetail(
  orderId: string,
  db: DbClient = getDb(),
): Promise<OrderBoard> {
  const board = await loadOrderBoard(orderId, db, { maskCustomerPhone: false });
  if (!board) {
    throw new AppError('ORDER_NOT_FOUND');
  }
  return board;
}
