import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DbClient } from '@/server/db/client';
import { products } from '@/server/db/schema';
import { hashClientIp } from '@/server/security/client-ip';
import { quoteCart } from '@/server/services/cart.service';
import { prepareCheckout } from '@/server/services/checkout.service';
import {
  advanceOrderStage,
  createOrder,
  lookupOrder,
} from '@/server/services/order.service';
import { closeTestDb, getTestDb, resetAndSeedTestDb } from '../../helpers/test-db';

let db: DbClient;

beforeAll(async () => {
  db = await getTestDb();
});

beforeEach(async () => {
  await resetAndSeedTestDb(db);
});

afterAll(async () => {
  await closeTestDb();
});

const VALID_CUSTOMER = {
  fullName: '  Nguyễn   Văn  An ',
  phone: '+84 912.345.789',
  provinceCode: '01',
  wardCode: '00004',
  streetAddress: '12 Nguyễn Huệ, Hoàn Kiếm',
  note: '  ',
};

describe('services/cart, checkout, order & rate-limit (Postgres 16)', () => {
  it('quotes cart with price changes, shipping tiers, and removed product names', async () => {
    expect(await quoteCart([], db)).toMatchObject({
      lines: [],
      removed: [],
      totalQuantity: 0,
      subtotalVnd: 0,
      shippingFeeVnd: 0,
      totalVnd: 0,
    });

    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, 'cpu-intel-core-i3-12100f'));

    const quote = await quoteCart(
      [
        { productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1, knownUnitPriceVnd: 10_000_000 },
        { productId: 'cpu-intel-core-i3-12100f', quantity: 1 },
        { productId: 'does-not-exist', quantity: 1 },
      ],
      db,
    );

    expect(quote.lines).toHaveLength(1);
    expect(quote.lines[0].priceChange).toEqual({ fromVnd: 10_000_000, toVnd: 14_390_000 });
    expect(quote.shippingFeeVnd).toBe(50_000);
    expect(quote.totalVnd).toBe(14_440_000);
    expect(quote.removed).toEqual([
      { productId: 'cpu-intel-core-i3-12100f', name: 'Intel Core i3-12100F' },
      { productId: 'does-not-exist', name: null },
    ]);
  });

  it('prepares checkout and rejects invalid address or unavailable products', async () => {
    const idempotencyKey = randomUUID();
    const prepared = await prepareCheckout(
      {
        idempotencyKey,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 2 }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'bank_transfer',
      },
      db,
    );

    expect(prepared.quote.freeShipping).toBe(true);
    expect(prepared.quote.shippingFeeVnd).toBe(0);
    expect(prepared.customer.phone).toBe('0912345789');
    expect(prepared.customer.phoneMasked).toBe('0912***789');
    expect(prepared.customer.note).toBeNull();
    expect(prepared.paymentReference).toMatch(/^TT[0-9A-HJKMNP-TV-Z]{8}$/);
    expect(prepared.bankInstructions?.qrImageDataUrl.startsWith('data:image/png;base64,')).toBe(
      true,
    );

    // Ward belonging to HCM ('79') paired with Hanoi ('01') fails
    await expect(
      prepareCheckout(
        {
          idempotencyKey,
          items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1 }],
          customer: { ...VALID_CUSTOMER, provinceCode: '01', wardCode: '26734' },
          paymentMethod: 'cod',
        },
        db,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });

    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, 'cpu-intel-core-i3-12100f'));

    await expect(
      prepareCheckout(
        {
          idempotencyKey,
          items: [{ productId: 'cpu-intel-core-i3-12100f', quantity: 1 }],
          customer: VALID_CUSTOMER,
          paymentMethod: 'cod',
        },
        db,
      ),
    ).rejects.toMatchObject({
      code: 'PRODUCT_UNAVAILABLE',
      status: 409,
    });
  });

  it('creates idempotent orders, replays, blocks key reuse mismatch, retries PK collision, and preserves snapshots', async () => {
    const key = randomUUID();
    const request = {
      idempotencyKey: key,
      items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1 }],
      customer: VALID_CUSTOMER,
      paymentMethod: 'cod' as const,
    };

    const created = await createOrder(request, key, db);
    expect(created.replayed).toBeUndefined();
    expect(created.order.stage).toBe(0);
    expect(created.order.totalVnd).toBe(14_440_000);
    expect(created.order.customer.phoneMasked).toBe('0912***789');
    expect(created.order.items[0].imageUrl).toBeTruthy();

    // Replay returns same order with replayed=true
    const replayed = await createOrder(request, key, db);
    expect(replayed.replayed).toBe(true);
    expect(replayed.order.orderId).toBe(created.order.orderId);

    // Reusing key with altered request payload triggers 409 IDEMPOTENCY_KEY_REUSED
    await expect(
      createOrder(
        { ...request, items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 2 }] },
        key,
        db,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_KEY_REUSED', status: 409 });

    // Admin changing product price or soft-deleting does NOT alter placed order snapshot
    await db
      .update(products)
      .set({ priceVnd: 99_000_000, deletedAt: new Date() })
      .where(eq(products.id, 'cpu-amd-ryzen-7-9800x3d'));

    const ipHash = hashClientIp('198.51.100.1');
    const fetched = await lookupOrder(
      { orderId: created.order.orderId.toLowerCase(), phone: '0912 345 789' },
      ipHash,
      db,
    );
    expect(fetched.order.items[0].unitPriceVnd).toBe(14_390_000);
    expect(fetched.order.items[0].imageUrl).toBe(created.order.items[0].imageUrl);

    // Order ID collision triggers transaction retry on 23505 orders_pkey
    const key2 = randomUUID();
    let calls = 0;
    const retried = await createOrder(
      {
        idempotencyKey: key2,
        items: [{ productId: 'cpu-intel-core-i3-12100f', quantity: 1 }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'card',
      },
      key2,
      db,
      () => {
        calls += 1;
        return calls === 1 ? created.order.orderId : 'PC-23456789AB';
      },
    );
    expect(calls).toBe(2);
    expect(retried.order.orderId).toBe('PC-23456789AB');
  });

  it('enforces lookup rate limiting (5 failures / 15 min) and atomic stage advance', async () => {
    const key = randomUUID();
    const created = await createOrder(
      {
        idempotencyKey: key,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1 }],
        customer: VALID_CUSTOMER,
        paymentMethod: 'cod',
      },
      key,
      db,
    );

    const ipHash = hashClientIp('203.0.113.55');
    const t0 = new Date('2026-11-18T10:00:00Z');

    for (let i = 0; i < 5; i++) {
      await expect(
        lookupOrder(
          { orderId: i === 0 ? 'bad-format' : created.order.orderId, phone: '0999999999' },
          ipHash,
          db,
          new Date(t0.getTime() + i * 1000),
        ),
      ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND', status: 404 });
    }

    // 6th attempt is blocked with 429 even with valid credentials
    await expect(
      lookupOrder(
        { orderId: created.order.orderId, phone: '0912345789' },
        ipHash,
        db,
        new Date(t0.getTime() + 60_000),
      ),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });

    // After 15 minutes pass, sliding window expires
    const afterWindow = await lookupOrder(
      { orderId: created.order.orderId, phone: '0912345789' },
      ipHash,
      db,
      new Date(t0.getTime() + 16 * 60_000),
    );
    expect(afterWindow.order.orderId).toBe(created.order.orderId);

    // Advance stages atomically 0 -> 1 -> 2 -> 3 -> 4
    const s1 = await advanceOrderStage(created.order.orderId, 0, db);
    expect(s1.stage).toBe(1);

    // Concurrent/stale expectedStage 0 returns 409 STALE_STAGE with current board
    await expect(advanceOrderStage(created.order.orderId, 0, db)).rejects.toMatchObject({
      code: 'STALE_STAGE',
      status: 409,
    });

    await advanceOrderStage(created.order.orderId, 1, db);
    await advanceOrderStage(created.order.orderId, 2, db);
    const s4 = await advanceOrderStage(created.order.orderId, 3, db);
    expect(s4.isCompleted).toBe(true);

    await expect(advanceOrderStage(created.order.orderId, 4, db)).rejects.toMatchObject({
      code: 'ORDER_COMPLETED',
      status: 409,
    });
  });
});
