import { randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@/server/auth/password';
import { signSessionToken } from '@/server/auth/session';
import type { DbClient } from '@/server/db/client';
import { users } from '@/server/db/schema';
import { requireOrderViewer } from '@/server/http/route-helpers';
import { hashClientIp } from '@/server/security/client-ip';
import {
  loginWithCredentials,
  registerCustomer,
  upsertOAuthUser,
} from '@/server/services/auth.service';
import { createOrder, listOrdersForUser } from '@/server/services/order.service';
import { resetSampleData } from '@/server/services/reset.service';
import { AUTH_SESSION_COOKIE } from '@/shared/constants';
import { TEST_STORAGE_CONFIG, setupTestDbLifecycle } from '../../helpers/test-db';

let db: DbClient;

setupTestDbLifecycle({
  onBeforeAll: async (client) => {
    db = client;
    process.env.ADMIN_PASSWORD = await hashPassword('admin-secret-123');
  },
  onBeforeEach: async (client) => {
    await client.delete(users);
  },
});

describe('services/auth & user-scoped orders (Postgres 16)', () => {
  it('registers customer accounts, blocks reserved admin username, and rejects duplicates', async () => {
    const ipHash = hashClientIp('198.51.100.1');

    await expect(
      registerCustomer(
        { username: 'Admin', displayName: 'Fake Admin', password: 'password123' },
        ipHash,
        db,
      ),
    ).rejects.toThrow();

    const created = await registerCustomer(
      { username: '  KhachHang01 ', displayName: 'Nguyễn Văn A', password: 'password123' },
      ipHash,
      db,
    );
    expect(created.role).toBe('customer');
    expect(created.username).toBe('khachhang01');
    expect(created.displayName).toBe('Nguyễn Văn A');

    await expect(
      registerCustomer(
        { username: 'khachhang01', displayName: 'Khác', password: 'password123' },
        ipHash,
        db,
      ),
    ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });
  });

  it('logs in customer and integrated admin credentials with rate limiting', async () => {
    const ipHash = hashClientIp('198.51.100.2');
    await registerCustomer(
      { username: 'buyer1', displayName: 'Buyer One', password: 'secret-password' },
      ipHash,
      db,
    );

    const customer = await loginWithCredentials(
      { username: 'Buyer1', password: 'secret-password' },
      ipHash,
      db,
    );
    expect(customer.role).toBe('customer');

    const admin = await loginWithCredentials(
      { username: 'admin', password: 'admin-secret-123' },
      ipHash,
      db,
    );
    expect(admin.role).toBe('admin');
    expect(admin.username).toBe('admin');

    for (let i = 0; i < 5; i++) {
      await expect(
        loginWithCredentials({ username: 'admin', password: 'wrong' }, ipHash, db),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
    }
    await expect(
      loginWithCredentials({ username: 'admin', password: 'admin-secret-123' }, ipHash, db),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  });

  it('upserts Google (verified email merge) and Facebook (isolated) OAuth accounts', async () => {
    const gUser = await upsertOAuthUser(
      {
        provider: 'google',
        providerAccountId: 'g-1',
        displayName: 'Google User',
        email: 'shared@example.com',
        emailVerified: true,
        avatarUrl: 'https://lh3.googleusercontent.com/1',
      },
      db,
    );
    expect(gUser.role).toBe('customer');

    // Facebook with unverified email does NOT hijack Google user
    const fbUser = await upsertOAuthUser(
      {
        provider: 'facebook',
        providerAccountId: 'fb-1',
        displayName: 'FB User',
        email: 'shared@example.com',
        emailVerified: false,
        avatarUrl: null,
      },
      db,
    );
    expect(fbUser.id).not.toBe(gUser.id);

    // Repeat Google login updates displayName cleanly on same user
    const gAgain = await upsertOAuthUser(
      {
        provider: 'google',
        providerAccountId: 'g-1',
        displayName: 'Google User Updated',
        email: 'shared@example.com',
        emailVerified: true,
        avatarUrl: 'https://lh3.googleusercontent.com/2',
      },
      db,
    );
    expect(gAgain.id).toBe(gUser.id);
    expect(gAgain.displayName).toBe('Google User Updated');
  });

  it('scopes orders to owning user, authorizes board via session, and preserves users on reset', async () => {
    const ipHash = hashClientIp('198.51.100.3');
    const u1 = await registerCustomer(
      { username: 'owner1', displayName: 'Owner 1', password: 'password123' },
      ipHash,
      db,
    );
    const u2 = await registerCustomer(
      { username: 'owner2', displayName: 'Owner 2', password: 'password123' },
      ipHash,
      db,
    );

    const key = randomUUID();
    const created = await createOrder(
      {
        idempotencyKey: key,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1 }],
        customer: {
          fullName: 'Owner 1',
          phone: '0912345678',
          provinceCode: '01',
          wardCode: '00004',
          streetAddress: '12 Nguyễn Huệ, Hoàn Kiếm',
        },
        paymentMethod: 'cod',
      },
      key,
      db,
      undefined,
      u1.id,
    );

    const u1Orders = await listOrdersForUser(u1.id, db);
    expect(u1Orders).toHaveLength(1);
    expect(u1Orders[0].orderId).toBe(created.order.orderId);
    expect(await listOrdersForUser(u2.id, db)).toEqual([]);

    const u1Token = await signSessionToken(u1);
    const u2Token = await signSessionToken(u2);

    await expect(
      requireOrderViewer(
        new NextRequest(`https://techcore.vn/api/orders/${created.order.orderId}`, {
          headers: { cookie: `${AUTH_SESSION_COOKIE}=${u1Token}` },
        }),
        created.order.orderId,
        db,
      ),
    ).resolves.toBeUndefined();

    await expect(
      requireOrderViewer(
        new NextRequest(`https://techcore.vn/api/orders/${created.order.orderId}`, {
          headers: { cookie: `${AUTH_SESSION_COOKIE}=${u2Token}` },
        }),
        created.order.orderId,
        db,
      ),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });

    // Reset clears orders but keeps user accounts intact
    const resetRes = await resetSampleData(
      db,
      async () => ({ imagesPurged: 0, warnings: [] }),
      TEST_STORAGE_CONFIG,
    );
    expect(resetRes.ordersDeleted).toBe(1);
    expect(await listOrdersForUser(u1.id, db)).toEqual([]);

    const remainingUsers = await db.select().from(users);
    expect(remainingUsers).toHaveLength(2);
  });
});
