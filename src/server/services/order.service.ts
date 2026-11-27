import 'server-only';

import { createHash } from 'node:crypto';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { MY_ORDERS_MAX_ROWS, ORDER_STAGE_VALUES } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { orderLookupSchema } from '@/shared/schemas';
import type {
  CheckoutRequest,
  CustomerOrderSummary,
  OrderBoard,
  OrderStage,
  OrderWithToken,
  PaymentMethod,
} from '@/shared/types';
import { signOrderAccessToken } from '../auth/order-token';
import { getDb, type DbClient, type DbExecutor } from '../db/client';
import { orderItems, orders, orderStatusEvents, products } from '../db/schema';
import { formatAddressLine } from '../domain/name';
import { maskPhone } from '../domain/masking';
import { generateOrderId } from '../domain/order-id';
import { AppError, extractPgError } from '../http/errors';
import { derivePaymentReference } from '../payments/demo-bank';
import { checkRateLimit, recordAuthFailure } from '../security/rate-limit';
import { quoteCart } from './cart.service';
import { validateCheckoutCustomer, type ValidatedCheckoutCustomer } from './checkout.service';

const MAX_ORDER_ID_RETRIES = 5;

export function computeCanonicalRequestHash(
  items: readonly { productId: string; quantity: number }[],
  customer: ValidatedCheckoutCustomer,
  paymentMethod: PaymentMethod,
): string {
  const canonical = {
    items: [...items]
      .map((i) => ({ productId: i.productId, quantity: i.quantity }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
    customer: {
      fullName: customer.fullName,
      phone: customer.phone,
      provinceCode: customer.provinceCode,
      wardCode: customer.wardCode,
      streetAddress: customer.streetAddress,
      note: customer.note,
    },
    paymentMethod,
  };
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

export interface OrderItemRowWithImage {
  item: typeof orderItems.$inferSelect;
  imageUrl: string | null;
}

export function resolveOrderStatusMeta(row: {
  statusStage: number;
  cancelledAt: Date | null;
}): {
  stage: OrderStage;
  cancelledAt: string | null;
  isCancelled: boolean;
  stageLabel: string;
} {
  const stage = row.statusStage as OrderStage;
  const cancelledAt = row.cancelledAt ? row.cancelledAt.toISOString() : null;
  const isCancelled = cancelledAt !== null;
  return {
    stage,
    cancelledAt,
    isCancelled,
    stageLabel: isCancelled ? VI_MESSAGES.orders.cancelledStatus : VI_MESSAGES.orders.stages[stage],
  };
}

export function mapCustomerOrderSummary(row: {
  id: string;
  customerName: string;
  totalQuantity: number;
  totalVnd: number;
  statusStage: number;
  cancelledAt: Date | null;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}): CustomerOrderSummary {
  return {
    orderId: row.id,
    customerName: row.customerName,
    totalQuantity: row.totalQuantity,
    totalVnd: row.totalVnd,
    ...resolveOrderStatusMeta(row),
    paymentMethod: row.paymentMethod,
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildOrderBoardFromRows(
  orderRow: typeof orders.$inferSelect,
  itemRows: OrderItemRowWithImage[],
  eventRows: (typeof orderStatusEvents.$inferSelect)[],
  options: { maskCustomerPhone: boolean },
): OrderBoard {
  const reachedByStage = new Map<number, string>(
    eventRows.map((event) => [event.stage, event.occurredAt.toISOString()]),
  );

  const { stage, cancelledAt, isCancelled } = resolveOrderStatusMeta(orderRow);

  return {
    orderId: orderRow.id,
    stage,
    stages: ORDER_STAGE_VALUES.map((stageNum) => ({
      stage: stageNum,
      label: VI_MESSAGES.orders.stages[stageNum],
      reachedAt: reachedByStage.get(stageNum) ?? null,
    })),
    isCompleted: !isCancelled && stage === 4,
    isCancelled,
    cancelledAt,
    canCancel: !isCancelled && stage === 0,
    customer: {
      fullName: orderRow.customerName,
      phoneMasked: options.maskCustomerPhone ? maskPhone(orderRow.phone) : orderRow.phone,
      addressLine: formatAddressLine(
        orderRow.streetAddress,
        orderRow.wardName,
        orderRow.provinceName,
      ),
      note: orderRow.note,
    },
    paymentMethod: orderRow.paymentMethod,
    paymentReference: orderRow.paymentReference,
    items: itemRows
      .slice()
      .sort((a, b) => a.item.lineNo - b.item.lineNo)
      .map(({ item, imageUrl }) => ({
        productName: item.productName,
        category: item.category,
        imageUrl: imageUrl ?? null,
        unitPriceVnd: item.unitPriceVnd,
        quantity: item.quantity,
        lineTotalVnd: item.lineTotalVnd,
      })),
    totalQuantity: orderRow.totalQuantity,
    subtotalVnd: orderRow.subtotalVnd,
    shippingFeeVnd: orderRow.shippingFeeVnd,
    totalVnd: orderRow.totalVnd,
    createdAt: orderRow.createdAt.toISOString(),
  };
}

export async function loadOrderBoard(
  orderId: string,
  db: DbExecutor,
  options: { maskCustomerPhone: boolean },
): Promise<OrderBoard | null> {
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!orderRow) {
    return null;
  }

  const [itemRows, eventRows] = await Promise.all([
    db
      .select({
        item: orderItems,
        imageUrl: products.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.lineNo)),
    db
      .select()
      .from(orderStatusEvents)
      .where(eq(orderStatusEvents.orderId, orderId))
      .orderBy(asc(orderStatusEvents.stage)),
  ]);

  return buildOrderBoardFromRows(orderRow, itemRows, eventRows, options);
}

async function resolveExistingIdempotentOrder(
  idempotencyKey: string,
  requestHash: string,
  tx: DbExecutor,
): Promise<OrderBoard | null> {
  const [existing] = await tx
    .select()
    .from(orders)
    .where(eq(orders.idempotencyKey, idempotencyKey))
    .limit(1);

  if (!existing) {
    return null;
  }

  if (existing.requestHash !== requestHash) {
    throw new AppError('IDEMPOTENCY_KEY_REUSED');
  }

  const board = await loadOrderBoard(existing.id, tx, { maskCustomerPhone: true });
  if (!board) {
    throw new AppError('INTERNAL');
  }
  return board;
}

export async function createOrder(
  request: CheckoutRequest,
  headerIdempotencyKey: string | null,
  db: DbClient = getDb(),
  generateId: () => string = generateOrderId,
  userId: string | null = null,
): Promise<OrderWithToken> {
  if (!headerIdempotencyKey || headerIdempotencyKey.trim() !== request.idempotencyKey) {
    throw new AppError('VALIDATION_ERROR', {
      message: 'Thiếu hoặc không khớp khóa Idempotency-Key.',
    });
  }

  // Validate static customer & address constraints without touching product availability yet.
  const customer = validateCheckoutCustomer(request);
  const requestHash = computeCanonicalRequestHash(
    request.items,
    customer,
    request.paymentMethod,
  );

  for (let attempt = 1; attempt <= MAX_ORDER_ID_RETRIES; attempt++) {
    try {
      const outcome = await db.transaction(async (tx) => {
        const replayedExisting = await resolveExistingIdempotentOrder(
          request.idempotencyKey,
          requestHash,
          tx,
        );
        if (replayedExisting) {
          return { board: replayedExisting, replayed: true };
        }

        const quote = await quoteCart(
          request.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          tx,
        );
        if (quote.removed.length > 0) {
          throw new AppError('PRODUCT_UNAVAILABLE', {
            details: { items: quote.removed },
          });
        }

        const orderId = generateId();
        const paymentReference = derivePaymentReference(request.idempotencyKey);

        const inserted = await tx
          .insert(orders)
          .values({
            id: orderId,
            userId,
            idempotencyKey: request.idempotencyKey,
            requestHash,
            customerName: customer.fullName,
            phone: customer.phone,
            provinceCode: customer.provinceCode,
            provinceName: customer.provinceName,
            wardCode: customer.wardCode,
            wardName: customer.wardName,
            streetAddress: customer.streetAddress,
            note: customer.note,
            paymentMethod: request.paymentMethod,
            paymentReference,
            totalQuantity: quote.totalQuantity,
            subtotalVnd: quote.subtotalVnd,
            shippingFeeVnd: quote.shippingFeeVnd,
            totalVnd: quote.totalVnd,
            statusStage: 0,
          })
          .onConflictDoNothing({ target: orders.idempotencyKey })
          .returning({ id: orders.id });

        if (inserted.length === 0) {
          const raceWinner = await resolveExistingIdempotentOrder(
            request.idempotencyKey,
            requestHash,
            tx,
          );
          if (!raceWinner) {
            throw new AppError('INTERNAL');
          }
          return { board: raceWinner, replayed: true };
        }

        await tx.insert(orderItems).values(
          quote.lines.map((line, index) => ({
            orderId,
            lineNo: index + 1,
            productId: line.productId,
            productName: line.name,
            category: line.category,
            unitPriceVnd: line.unitPriceVnd,
            quantity: line.quantity,
            lineTotalVnd: line.lineTotalVnd,
          })),
        );

        await tx.insert(orderStatusEvents).values({
          orderId,
          stage: 0,
        });

        const createdBoard = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
        if (!createdBoard) {
          throw new AppError('INTERNAL');
        }
        return { board: createdBoard, replayed: false };
      });

      const accessToken = await signOrderAccessToken(outcome.board.orderId);
      return {
        order: outcome.board,
        accessToken,
        ...(outcome.replayed ? { replayed: true } : {}),
      };
    } catch (error) {
      const pg = extractPgError(error);
      if (pg.code === '23505' && pg.constraint === 'orders_pkey' && attempt < MAX_ORDER_ID_RETRIES) {
        continue;
      }
      throw error;
    }
  }

  throw new AppError('INTERNAL');
}

export async function lookupOrder(
  rawInput: { orderId: unknown; phone: unknown },
  ipHash: string,
  db: DbClient = getDb(),
  now?: Date,
): Promise<OrderWithToken> {
  await checkRateLimit(db, 'order_lookup', ipHash, now);

  const parsed = orderLookupSchema.safeParse(rawInput);
  if (!parsed.success) {
    await recordAuthFailure(db, 'order_lookup', ipHash, now);
    throw new AppError('ORDER_NOT_FOUND');
  }

  const [matched] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, parsed.data.orderId), eq(orders.phone, parsed.data.phone)))
    .limit(1);

  if (!matched) {
    await recordAuthFailure(db, 'order_lookup', ipHash, now);
    throw new AppError('ORDER_NOT_FOUND');
  }

  const board = await loadOrderBoard(matched.id, db, { maskCustomerPhone: true });
  if (!board) {
    throw new AppError('ORDER_NOT_FOUND');
  }

  const accessToken = await signOrderAccessToken(board.orderId);
  return { order: board, accessToken };
}

export async function listOrdersForUser(
  userId: string,
  db: DbClient = getDb(),
): Promise<CustomerOrderSummary[]> {
  const rows = await db
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
    .orderBy(desc(orders.createdAt))
    .limit(MY_ORDERS_MAX_ROWS);

  return rows.map(mapCustomerOrderSummary);
}

export async function getOrderBoardForCustomer(
  orderId: string,
  db: DbClient = getDb(),
): Promise<OrderBoard> {
  const board = await loadOrderBoard(orderId, db, { maskCustomerPhone: true });
  if (!board) {
    throw new AppError('ORDER_NOT_FOUND');
  }
  return board;
}

async function throwOrderStateConflict(
  code: 'ORDER_CANCELLED' | 'STALE_STAGE' | 'ORDER_CANCEL_NOT_ALLOWED',
  orderId: string,
  tx: DbExecutor,
): Promise<never> {
  const board = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
  throw new AppError(code, {
    details: board ? { order: board } : undefined,
  });
}

export async function advanceOrderStage(
  orderId: string,
  expectedStage: OrderStage,
  db: DbClient = getDb(),
): Promise<OrderBoard> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: orders.id,
        statusStage: orders.statusStage,
        cancelledAt: orders.cancelledAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!current) {
      throw new AppError('ORDER_NOT_FOUND');
    }

    if (current.cancelledAt !== null) {
      await throwOrderStateConflict('ORDER_CANCELLED', orderId, tx);
    }

    if (current.statusStage >= 4 && expectedStage === 4) {
      throw new AppError('ORDER_COMPLETED');
    }

    if (current.statusStage !== expectedStage) {
      await throwOrderStateConflict('STALE_STAGE', orderId, tx);
    }

    const updated = await tx
      .update(orders)
      .set({
        statusStage: expectedStage + 1,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.statusStage, expectedStage),
          isNull(orders.cancelledAt),
          sql`${orders.statusStage} < 4`,
        ),
      )
      .returning({ id: orders.id });

    if (updated.length === 0) {
      const board = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
      throw new AppError(board?.isCancelled ? 'ORDER_CANCELLED' : 'STALE_STAGE', {
        details: board ? { order: board } : undefined,
      });
    }

    await tx
      .insert(orderStatusEvents)
      .values({
        orderId,
        stage: expectedStage + 1,
      })
      .onConflictDoNothing();

    const updatedBoard = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
    if (!updatedBoard) {
      throw new AppError('INTERNAL');
    }
    return updatedBoard;
  });
}

export async function cancelOrder(
  orderId: string,
  db: DbClient = getDb(),
): Promise<OrderBoard> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: orders.id,
        statusStage: orders.statusStage,
        cancelledAt: orders.cancelledAt,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!current) {
      throw new AppError('ORDER_NOT_FOUND');
    }

    if (current.cancelledAt !== null) {
      await throwOrderStateConflict('ORDER_CANCELLED', orderId, tx);
    }

    if (current.statusStage !== 0) {
      await throwOrderStateConflict('ORDER_CANCEL_NOT_ALLOWED', orderId, tx);
    }

    const updated = await tx
      .update(orders)
      .set({
        cancelledAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.statusStage, 0),
          isNull(orders.cancelledAt),
        ),
      )
      .returning({ id: orders.id });

    if (updated.length === 0) {
      const board = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
      throw new AppError(board?.isCancelled ? 'ORDER_CANCELLED' : 'ORDER_CANCEL_NOT_ALLOWED', {
        details: board ? { order: board } : undefined,
      });
    }

    const updatedBoard = await loadOrderBoard(orderId, tx, { maskCustomerPhone: true });
    if (!updatedBoard) {
      throw new AppError('INTERNAL');
    }
    return updatedBoard;
  });
}
