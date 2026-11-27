import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { hashPassword } from '@/server/auth/password';
import { signSessionToken } from '@/server/auth/session';
import type { DbClient } from '@/server/db/client';
import { authFailures, emailOtps, oauthAccounts, users } from '@/server/db/schema';
import {
  notifyOrderDeliveredIfPossible,
  notifyOrderPlacedIfPossible,
} from '@/server/email/order-notifications';
import type { EmailSender, SendEmailPayload } from '@/server/email/resend';
import { requireOrderViewer } from '@/server/http/route-helpers';
import { hashClientIp } from '@/server/security/client-ip';
import {
  changeCustomerPassword,
  loginWithCredentials,
  requestFacebookEmailOtp,
  requestPasswordResetOtp,
  requestRegistrationOtp,
  resetPasswordWithOtp,
  resolveFacebookOAuthLogin,
  upsertOAuthUser,
  verifyFacebookEmailOtp,
  verifyRegistrationOtp,
} from '@/server/services/auth.service';
import {
  advanceOrderStage,
  cancelOrder,
  createOrder,
  listOrdersForUser,
} from '@/server/services/order.service';
import { getUserProfile } from '@/server/services/profile.service';
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
    await client.delete(emailOtps);
    await client.delete(authFailures);
    await client.delete(users);
  },
});

function createCapturingSender() {
  const sent: Array<SendEmailPayload & { code: string }> = [];
  const sender: EmailSender = async (payload) => {
    const match = payload.text.match(/Ma OTP cua ban:\s*(\d{6})/);
    sent.push({ ...payload, code: match?.[1] ?? '' });
    return { id: `mock-${sent.length}` };
  };
  return { sent, sender };
}

async function registerVerifiedCustomer(
  input: { username: string; displayName: string; email: string; password: string },
  ipHash: string,
  now: Date = new Date(),
) {
  const { sent, sender } = createCapturingSender();
  await requestRegistrationOtp(input, ipHash, db, sender, now);
  expect(sent).toHaveLength(1);
  return verifyRegistrationOtp(
    { email: input.email, code: sent[0].code },
    ipHash,
    db,
    new Date(now.getTime() + 1000),
  );
}

describe('services/auth, OTP flows, profile stats & email notifications (Postgres 16)', () => {
  it('enforces OTP verification for registration, duplicate checks, cooldown, and max attempts', async () => {
    const ipHash = hashClientIp('198.51.100.1');
    const t0 = new Date('2026-11-26T10:00:00Z');
    const { sent, sender } = createCapturingSender();

    await expect(
      requestRegistrationOtp(
        {
          username: 'Admin',
          displayName: 'Fake Admin',
          email: 'fake@example.com',
          password: 'password123',
        },
        ipHash,
        db,
        sender,
        t0,
      ),
    ).rejects.toThrow();

    const otpMeta = await requestRegistrationOtp(
      {
        username: '  KhachHang01 ',
        displayName: 'Nguyễn Văn A',
        email: '  Khach01@Example.COM ',
        password: 'password123',
      },
      ipHash,
      db,
      sender,
      t0,
    );
    expect(otpMeta.email).toBe('khach01@example.com');
    expect(sent).toHaveLength(1);
    expect(sent[0].code).toMatch(/^\d{6}$/);

    // Immediate resend hits 60s cooldown
    await expect(
      requestRegistrationOtp(
        {
          username: 'khachhang01',
          displayName: 'Nguyễn Văn A',
          email: 'khach01@example.com',
          password: 'password123',
        },
        ipHash,
        db,
        sender,
        new Date(t0.getTime() + 5_000),
      ),
    ).rejects.toMatchObject({ code: 'OTP_COOLDOWN', status: 429 });

    // Wrong OTP fails with OTP_INVALID without creating account
    await expect(
      verifyRegistrationOtp(
        { email: 'khach01@example.com', code: '000000' === sent[0].code ? '999999' : '000000' },
        hashClientIp('198.51.100.91'),
        db,
        new Date(t0.getTime() + 6_000),
      ),
    ).rejects.toMatchObject({ code: 'OTP_INVALID', status: 400 });

    const created = await verifyRegistrationOtp(
      { email: 'khach01@example.com', code: sent[0].code },
      hashClientIp('198.51.100.92'),
      db,
      new Date(t0.getTime() + 7_000),
    );
    expect(created.role).toBe('customer');
    expect(created.username).toBe('khachhang01');
    expect(created.displayName).toBe('Nguyễn Văn A');

    // Duplicate username & email rejected
    await expect(
      requestRegistrationOtp(
        {
          username: 'khachhang01',
          displayName: 'Khác',
          email: 'other@example.com',
          password: 'password123',
        },
        hashClientIp('198.51.100.93'),
        db,
        sender,
        new Date(t0.getTime() + 8_000),
      ),
    ).rejects.toMatchObject({ code: 'USERNAME_TAKEN', status: 409 });

    await expect(
      requestRegistrationOtp(
        {
          username: 'khachhang02',
          displayName: 'Khác',
          email: 'khach01@example.com',
          password: 'password123',
        },
        hashClientIp('198.51.100.94'),
        db,
        sender,
        new Date(t0.getTime() + 9_000),
      ),
    ).rejects.toMatchObject({ code: 'EMAIL_TAKEN', status: 409 });

    // 5 consecutive wrong OTP attempts lock out that OTP code
    const tLock = new Date('2026-11-26T10:15:00Z');
    await requestRegistrationOtp(
      {
        username: 'lockuser',
        displayName: 'Lock User',
        email: 'lock@example.com',
        password: 'password123',
      },
      hashClientIp('198.51.100.95'),
      db,
      sender,
      tLock,
    );
    const lockCode = sent[1].code;
    const wrongCode = lockCode === '123456' ? '654321' : '123456';
    for (let i = 0; i < 4; i++) {
      await expect(
        verifyRegistrationOtp(
          { email: 'lock@example.com', code: wrongCode },
          hashClientIp(`198.51.100.${100 + i}`),
          db,
          new Date(tLock.getTime() + 1000 * (i + 1)),
        ),
      ).rejects.toMatchObject({ code: 'OTP_INVALID', status: 400 });
    }
    await expect(
      verifyRegistrationOtp(
        { email: 'lock@example.com', code: wrongCode },
        hashClientIp('198.51.100.105'),
        db,
        new Date(tLock.getTime() + 6_000),
      ),
    ).rejects.toMatchObject({ code: 'OTP_MAX_ATTEMPTS', status: 400 });

    // Concurrent wrong OTP verification increments attempts atomically without losing increments
    const tRace = new Date('2026-11-26T10:18:00Z');
    await requestRegistrationOtp(
      {
        username: 'raceuser',
        displayName: 'Race User',
        email: 'race@example.com',
        password: 'password123',
      },
      hashClientIp('198.51.100.110'),
      db,
      sender,
      tRace,
    );
    const raceCode = sent[2].code;
    const raceWrong = raceCode === '123456' ? '654321' : '123456';
    const [r1, r2] = await Promise.allSettled([
      verifyRegistrationOtp(
        { email: 'race@example.com', code: raceWrong },
        hashClientIp('198.51.100.111'),
        db,
        new Date(tRace.getTime() + 1000),
      ),
      verifyRegistrationOtp(
        { email: 'race@example.com', code: raceWrong },
        hashClientIp('198.51.100.112'),
        db,
        new Date(tRace.getTime() + 1000),
      ),
    ]);
    expect(r1.status).toBe('rejected');
    expect(r2.status).toBe('rejected');
    const [raceRow] = await db
      .select({ attempts: emailOtps.attempts })
      .from(emailOtps)
      .where(and(eq(emailOtps.purpose, 'register'), eq(emailOtps.email, 'race@example.com')))
      .orderBy(desc(emailOtps.createdAt))
      .limit(1);
    expect(raceRow.attempts).toBe(2);
  });

  it('logs in customer via username or email and admin with rate limiting', async () => {
    const ipHash = hashClientIp('198.51.100.2');
    await registerVerifiedCustomer(
      {
        username: 'buyer1',
        displayName: 'Buyer One',
        email: 'buyer1@example.com',
        password: 'secret-password',
      },
      ipHash,
    );

    const byUsername = await loginWithCredentials(
      { username: 'Buyer1', password: 'secret-password' },
      ipHash,
      db,
    );
    expect(byUsername.role).toBe('customer');

    const byEmail = await loginWithCredentials(
      { username: '  BUYER1@Example.com ', password: 'secret-password' },
      ipHash,
      db,
    );
    expect(byEmail.id).toBe(byUsername.id);

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

  it('allows direct Google login without OTP and enforces Facebook email OTP with account merge', async () => {
    const t0 = new Date('2026-11-26T11:00:00Z');
    const { sent, sender } = createCapturingSender();

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

    const fbProfile = {
      provider: 'facebook' as const,
      providerAccountId: 'fb-1',
      displayName: 'FB User',
      email: null,
      emailVerified: false,
      avatarUrl: 'https://graph.facebook.com/fb-1/picture',
    };

    // First-time Facebook login requires Email + OTP
    const initialFb = await resolveFacebookOAuthLogin(fbProfile, db);
    expect(initialFb).toEqual({ status: 'requires_email_otp' });

    const pendingFb = {
      providerAccountId: fbProfile.providerAccountId,
      displayName: fbProfile.displayName,
      avatarUrl: fbProfile.avatarUrl,
      next: '/',
    };
    const fbIp = hashClientIp('198.51.100.30');
    await requestFacebookEmailOtp(pendingFb, { email: 'shared@example.com' }, fbIp, db, sender, t0);
    expect(sent).toHaveLength(1);

    // After verifying matching email OTP, Facebook links cleanly onto the existing Google user
    const linkedFbUser = await verifyFacebookEmailOtp(
      pendingFb,
      { email: 'shared@example.com', code: sent[0].code },
      fbIp,
      db,
      new Date(t0.getTime() + 1000),
    );
    expect(linkedFbUser.id).toBe(gUser.id);
    expect(linkedFbUser.provider).toBe('facebook');

    // Subsequent Facebook login goes straight through without OTP
    const returningFb = await resolveFacebookOAuthLogin(fbProfile, db);
    expect(returningFb.status).toBe('authenticated');
    if (returningFb.status === 'authenticated') {
      expect(returningFb.user.id).toBe(gUser.id);
    }

    // Standalone new Facebook user with fresh email creates account + oauth link
    const fb2Pending = {
      providerAccountId: 'fb-2',
      displayName: 'FB Standalone',
      avatarUrl: null,
      next: '/cart',
    };
    const fb2Ip = hashClientIp('198.51.100.31');
    await requestFacebookEmailOtp(fb2Pending, { email: 'fb2@example.com' }, fb2Ip, db, sender, t0);
    const fb2User = await verifyFacebookEmailOtp(
      fb2Pending,
      { email: 'fb2@example.com', code: sent[1].code },
      fb2Ip,
      db,
      new Date(t0.getTime() + 1000),
    );
    expect(fb2User.id).not.toBe(gUser.id);

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

    // Legacy unverified Facebook row (without email) merges orders onto email owner on verify
    const [legacyUser] = await db
      .insert(users)
      .values({ displayName: 'Legacy FB', email: null })
      .returning();
    await db.insert(oauthAccounts).values({
      provider: 'facebook',
      providerAccountId: 'fb-legacy-3',
      userId: legacyUser.id,
      providerEmail: null,
    });
    const orderKey = randomUUID();
    await createOrder(
      {
        idempotencyKey: orderKey,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 2 }],
        customer: {
          fullName: 'Legacy FB',
          phone: '0912345678',
          provinceCode: '01',
          wardCode: '00004',
          streetAddress: '12 Nguyễn Huệ, Hoàn Kiếm',
        },
        paymentMethod: 'cod',
      },
      orderKey,
      db,
      undefined,
      legacyUser.id,
    );

    const legacyPending = {
      providerAccountId: 'fb-legacy-3',
      displayName: 'Legacy FB',
      avatarUrl: null,
      next: '/',
    };
    const fb3Ip = hashClientIp('198.51.100.32');
    await requestFacebookEmailOtp(
      legacyPending,
      { email: 'fb2@example.com' },
      fb3Ip,
      db,
      sender,
      new Date(t0.getTime() + 70_000),
    );
    const mergedUser = await verifyFacebookEmailOtp(
      legacyPending,
      { email: 'fb2@example.com', code: sent[2].code },
      fb3Ip,
      db,
      new Date(t0.getTime() + 72_000),
    );
    expect(mergedUser.id).toBe(fb2User.id);
    const migratedOrders = await listOrdersForUser(fb2User.id, db);
    expect(migratedOrders).toHaveLength(1);
  });

  it('resets forgotten password via OTP, changes password on profile, and blocks OAuth-only accounts', async () => {
    const t0 = new Date('2026-11-26T12:00:00Z');
    const ipHash = hashClientIp('198.51.100.40');
    const { sent, sender } = createCapturingSender();

    const user = await registerVerifiedCustomer(
      {
        username: 'resetme',
        displayName: 'Reset User',
        email: 'resetme@example.com',
        password: 'old-password-123',
      },
      ipHash,
      t0,
    );

    const googleOnly = await upsertOAuthUser(
      {
        provider: 'google',
        providerAccountId: 'g-oauth-only',
        displayName: 'Google Only',
        email: 'googleonly@example.com',
        emailVerified: true,
        avatarUrl: null,
      },
      db,
    );

    // OAuth-only account cannot use password reset or profile password change
    await expect(
      requestPasswordResetOtp(
        { email: 'googleonly@example.com' },
        hashClientIp('198.51.100.41'),
        db,
        sender,
        t0,
      ),
    ).rejects.toMatchObject({ code: 'OAUTH_ONLY_ACCOUNT', status: 400 });

    await expect(
      changeCustomerPassword(
        googleOnly.id,
        {
          currentPassword: 'anything',
          newPassword: 'new-password-1',
          confirmPassword: 'new-password-1',
        },
        hashClientIp('198.51.100.42'),
        db,
        t0,
      ),
    ).rejects.toMatchObject({ code: 'OAUTH_ONLY_ACCOUNT', status: 400 });

    // Unknown email returns silent success without sending any email
    await requestPasswordResetOtp(
      { email: 'nobody@example.com' },
      hashClientIp('198.51.100.43'),
      db,
      sender,
      t0,
    );
    expect(sent).toHaveLength(0);

    // Valid forgot password flow
    await requestPasswordResetOtp(
      { email: 'resetme@example.com' },
      hashClientIp('198.51.100.44'),
      db,
      sender,
      new Date(t0.getTime() + 5_000),
    );
    expect(sent).toHaveLength(1);

    await resetPasswordWithOtp(
      {
        email: 'resetme@example.com',
        code: sent[0].code,
        newPassword: 'reset-password-456',
        confirmPassword: 'reset-password-456',
      },
      hashClientIp('198.51.100.45'),
      db,
      new Date(t0.getTime() + 6_000),
    );

    await expect(
      loginWithCredentials(
        { username: 'resetme', password: 'old-password-123' },
        hashClientIp('198.51.100.46'),
        db,
      ),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });

    await expect(
      loginWithCredentials(
        { username: 'resetme@example.com', password: 'reset-password-456' },
        hashClientIp('198.51.100.47'),
        db,
      ),
    ).resolves.toMatchObject({ id: user.id });

    // Change password requires correct current password and new != current
    await expect(
      changeCustomerPassword(
        user.id,
        {
          currentPassword: 'wrong-current',
          newPassword: 'final-password-789',
          confirmPassword: 'final-password-789',
        },
        hashClientIp('198.51.100.48'),
        db,
      ),
    ).rejects.toMatchObject({ code: 'INVALID_CURRENT_PASSWORD', status: 400 });

    await expect(
      changeCustomerPassword(
        user.id,
        {
          currentPassword: 'reset-password-456',
          newPassword: 'reset-password-456',
          confirmPassword: 'reset-password-456',
        },
        hashClientIp('198.51.100.49'),
        db,
      ),
    ).rejects.toThrow();

    await changeCustomerPassword(
      user.id,
      {
        currentPassword: 'reset-password-456',
        newPassword: 'final-password-789',
        confirmPassword: 'final-password-789',
      },
      hashClientIp('198.51.100.50'),
      db,
    );

    await expect(
      loginWithCredentials(
        { username: 'resetme', password: 'final-password-789' },
        hashClientIp('198.51.100.51'),
        db,
      ),
    ).resolves.toMatchObject({ id: user.id });
  });

  it('computes profile stats, scopes orders, sends order notifications best-effort, and preserves users on reset', async () => {
    const ipHash = hashClientIp('198.51.100.3');
    const u1 = await registerVerifiedCustomer(
      {
        username: 'owner1',
        displayName: 'Owner 1',
        email: 'owner1@example.com',
        password: 'password123',
      },
      ipHash,
    );
    const u2 = await registerVerifiedCustomer(
      {
        username: 'owner2',
        displayName: 'Owner 2',
        email: 'owner2@example.com',
        password: 'password123',
      },
      hashClientIp('198.51.100.4'),
    );

    const k1 = randomUUID();
    const o1 = await createOrder(
      {
        idempotencyKey: k1,
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
      k1,
      db,
      undefined,
      u1.id,
    );

    const k2 = randomUUID();
    const o2 = await createOrder(
      {
        idempotencyKey: k2,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 2 }],
        customer: {
          fullName: 'Owner 1',
          phone: '0912345678',
          provinceCode: '01',
          wardCode: '00004',
          streetAddress: '12 Nguyễn Huệ, Hoàn Kiếm',
        },
        paymentMethod: 'bank_transfer',
      },
      k2,
      db,
      undefined,
      u1.id,
    );
    await cancelOrder(o2.order.orderId, db);

    for (let s = 0; s < 4; s++) {
      await advanceOrderStage(o1.order.orderId, s as 0 | 1 | 2 | 3, db);
    }

    const u1Profile = await getUserProfile(u1.id, db);
    expect(u1Profile.profile.email).toBe('owner1@example.com');
    expect(u1Profile.profile.emailVerified).toBe(true);
    expect(u1Profile.profile.hasPassword).toBe(true);
    expect(u1Profile.stats.totalOrders).toBe(2);
    expect(u1Profile.stats.completedOrders).toBe(1);
    expect(u1Profile.stats.cancelledOrders).toBe(1);
    expect(u1Profile.stats.totalSpentVnd).toBe(o1.order.totalVnd);
    expect(u1Profile.stats.totalItemsPurchased).toBe(1);

    const deliveredEmails: SendEmailPayload[] = [];
    const orderMailSender: EmailSender = async (payload) => {
      deliveredEmails.push(payload);
      return { id: `ord-${deliveredEmails.length}` };
    };
    await notifyOrderPlacedIfPossible(o1.order, u1.id, db, orderMailSender);
    await notifyOrderDeliveredIfPossible(o1.order, db, orderMailSender);
    await notifyOrderPlacedIfPossible(o1.order, null, db, orderMailSender);
    await notifyOrderDeliveredIfPossible(o1.order, db, async () => {
      throw new Error('simulated SMTP outage');
    });
    expect(deliveredEmails).toHaveLength(2);
    expect(deliveredEmails[0].to).toBe('owner1@example.com');
    expect(deliveredEmails[1].subject).toContain('đã giao thành công');

    const u1Orders = await listOrdersForUser(u1.id, db);
    expect(u1Orders).toHaveLength(2);
    expect(await listOrdersForUser(u2.id, db)).toEqual([]);

    const u1Token = await signSessionToken(u1);
    const u2Token = await signSessionToken(u2);

    await expect(
      requireOrderViewer(
        new NextRequest(`https://coreraster.me/api/orders/${o1.order.orderId}`, {
          headers: { cookie: `${AUTH_SESSION_COOKIE}=${u1Token}` },
        }),
        o1.order.orderId,
        db,
      ),
    ).resolves.toBeUndefined();

    await expect(
      requireOrderViewer(
        new NextRequest(`https://coreraster.me/api/orders/${o1.order.orderId}`, {
          headers: { cookie: `${AUTH_SESSION_COOKIE}=${u2Token}` },
        }),
        o1.order.orderId,
        db,
      ),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });

    // Reset clears orders but keeps user accounts intact
    const resetRes = await resetSampleData(
      db,
      async () => ({ imagesPurged: 0, warnings: [] }),
      TEST_STORAGE_CONFIG,
    );
    expect(resetRes.ordersDeleted).toBe(2);
    expect(await listOrdersForUser(u1.id, db)).toEqual([]);

    const remainingUsers = await db.select().from(users);
    expect(remainingUsers).toHaveLength(2);
  });
});
