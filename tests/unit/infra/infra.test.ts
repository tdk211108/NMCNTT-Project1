import { NextRequest } from 'next/server';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  isAdminRequest,
  readCookieFromRequest,
  requireAdmin,
  signAdminSessionToken,
  verifyAdminSessionToken,
} from '@/server/auth/admin-session';
import {
  extractBearerToken,
  signOrderAccessToken,
  verifyOrderAccessToken,
} from '@/server/auth/order-token';
import { listProvinces, listWardsByProvince, resolveProvinceAndWard } from '@/server/address/address.repo';
import { AppError, extractPgError, isDatabaseConnectionError, zodErrorToDetails } from '@/server/http/errors';
import { buildBankInstructions, buildDemoQrPayload, derivePaymentReference } from '@/server/payments/demo-bank';
import { getClientIp, hashClientIp } from '@/server/security/client-ip';
import { assertSameOrigin, resolveDeploymentOrigin } from '@/server/security/origin-check';
import { buildPublicObjectUrl, sniffImageMagicBytes } from '@/server/storage/supabase-storage';
import { AUTH_SESSION_COOKIE, ORDER_ID_ALPHABET } from '@/shared/constants';
import { z } from 'zod';
import { createDbConnection } from '@/server/db/client';
import { ensureTestAuthSecret } from '../../helpers/test-db';

beforeAll(() => {
  ensureTestAuthSecret();
});

describe('infra/auth & security', () => {
  it('signs and verifies admin session JWT and rejects order tokens', async () => {
    const adminToken = await signAdminSessionToken();
    const orderToken = await signOrderAccessToken('PC-7K3M9QX2TB');

    expect(await verifyAdminSessionToken(adminToken)).toBe(true);
    expect(await verifyAdminSessionToken('')).toBe(false);
    expect(await verifyAdminSessionToken(orderToken)).toBe(false);
    expect(await verifyAdminSessionToken(`${adminToken}corrupt`)).toBe(false);

    expect(await verifyOrderAccessToken(orderToken, 'PC-7K3M9QX2TB')).toBe(true);
    expect(await verifyOrderAccessToken(orderToken, 'PC-OTHERORDER')).toBe(false);
    expect(await verifyOrderAccessToken(adminToken, 'PC-7K3M9QX2TB')).toBe(false);
    expect(await verifyOrderAccessToken('', 'PC-7K3M9QX2TB')).toBe(false);
  });

  it('extracts cookies, bearer tokens, and checks requireAdmin', async () => {
    const token = await signAdminSessionToken();
    const reqWithCookie = new NextRequest('https://shop.example.com/api/admin/products', {
      headers: {
        cookie: `other=1; ${AUTH_SESSION_COOKIE}=${encodeURIComponent(token)}`,
        authorization: 'Bearer order-jwt-123',
      },
    });

    expect(readCookieFromRequest(reqWithCookie, AUTH_SESSION_COOKIE)).toBe(token);
    expect(extractBearerToken(reqWithCookie)).toBe('order-jwt-123');
    expect(await isAdminRequest(reqWithCookie)).toBe(true);
    await expect(requireAdmin(reqWithCookie)).resolves.toBeUndefined();

    const anonReq = new NextRequest('https://shop.example.com/api/admin/products');
    expect(await isAdminRequest(anonReq)).toBe(false);
    await expect(requireAdmin(anonReq)).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
  });

  it('enforces same-origin checks and resolves client IP hashes', () => {
    const validReq = new NextRequest('http://internal/api/admin/products', {
      method: 'POST',
      headers: {
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'techcore.vercel.app',
        origin: 'https://techcore.vercel.app',
        'x-forwarded-for': '203.0.113.10, 10.0.0.1',
      },
    });
    expect(resolveDeploymentOrigin(validReq)).toBe('https://techcore.vercel.app');
    expect(() => assertSameOrigin(validReq)).not.toThrow();
    expect(getClientIp(validReq)).toBe('203.0.113.10');
    expect(hashClientIp('203.0.113.10')).toHaveLength(64);

    const missingOriginReq = new NextRequest('https://techcore.vercel.app/api/admin/products', {
      method: 'POST',
    });
    expect(() => assertSameOrigin(missingOriginReq)).toThrowError(AppError);
    expect(getClientIp(missingOriginReq)).toBe('unknown');

    const crossOriginReq = new NextRequest('https://techcore.vercel.app/api/admin/products', {
      method: 'POST',
      headers: { origin: 'https://evil.example.com' },
    });
    expect(() => assertSameOrigin(crossOriginReq)).toThrowError(AppError);
  });
});

describe('infra/address, demo-bank, storage, errors', () => {
  it('loads 34 Vietnamese provinces and 3,321 wards and rejects cross-province ward codes', () => {
    const provinces = listProvinces();
    expect(provinces).toHaveLength(34);

    let totalWards = 0;
    for (const p of provinces) {
      const wards = listWardsByProvince(p.code);
      expect(wards).not.toBeNull();
      totalWards += wards!.length;
    }
    expect(totalWards).toBe(3321);
    expect(listWardsByProvince('999')).toBeNull();

    const hanoiWards = listWardsByProvince('01')!;
    const hcmWards = listWardsByProvince('79')!;
    expect(resolveProvinceAndWard('01', hanoiWards[0].code)).toMatchObject({
      provinceName: expect.any(String),
      wardName: hanoiWards[0].name,
    });
    expect(resolveProvinceAndWard('01', hcmWards[0].code)).toBeNull();
  });

  it('generates deterministic TT payment reference and DEMO QR payload', async () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    const ref1 = derivePaymentReference(key);
    const ref2 = derivePaymentReference(key);
    expect(ref1).toBe(ref2);
    expect(ref1).toMatch(new RegExp(`^TT[${ORDER_ID_ALPHABET}]{8}$`));

    const payload = buildDemoQrPayload('Demo Bank', '1234', 500000, `TechCore ${ref1}`);
    expect(payload.startsWith('DEMO')).toBe(true);

    const instructions = await buildBankInstructions(ref1, 500000);
    expect(instructions.transferMemo).toContain(ref1);
    expect(instructions.qrImageDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('sniffs image magic bytes and builds public URLs', () => {
    expect(sniffImageMagicBytes(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toEqual({
      ext: 'jpg',
      contentType: 'image/jpeg',
    });
    expect(
      sniffImageMagicBytes(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])),
    ).toEqual({
      ext: 'png',
      contentType: 'image/png',
    });
    expect(
      sniffImageMagicBytes(Buffer.from('RIFF\x00\x00\x00\x00WEBPextra', 'latin1')),
    ).toEqual({
      ext: 'webp',
      contentType: 'image/webp',
    });
    expect(sniffImageMagicBytes(Buffer.from('<svg></svg>', 'utf8'))).toBeNull();

    expect(
      buildPublicObjectUrl('uploads/a.webp', {
        supabaseUrl: 'https://demo.supabase.co',
        bucket: 'product-images',
      }),
    ).toBe('https://demo.supabase.co/storage/v1/object/public/product-images/uploads/a.webp');
  });

  it('maps Zod, Postgres, and DB connection errors cleanly', () => {
    const parsed = z.object({ a: z.number() }).safeParse({ a: 'bad' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(zodErrorToDetails(parsed.error).fieldErrors.a.length).toBeGreaterThan(0);
    }

    const wrapped = { cause: { code: '23505', constraint_name: 'orders_pkey' } };
    expect(extractPgError(wrapped)).toEqual({ code: '23505', constraint: 'orders_pkey' });
    expect(isDatabaseConnectionError({ cause: { code: 'ECONNREFUSED' } })).toBe(true);
    expect(isDatabaseConnectionError(new Error('other'))).toBe(false);
  });

  it('configures Supavisor-safe pool defaults with pipelining disabled', async () => {
    const { sql } = createDbConnection('postgresql://user:pass@localhost:6543/postgres');
    try {
      expect(sql.options.prepare).toBe(false);
      expect(sql.options.max_pipeline).toBe(1);
      expect(sql.options.query_timeout).toBe(15);
      expect(sql.options.queue_timeout).toBe(10);
      expect(sql.options.connect_timeout).toBe(10);
    } finally {
      await sql.end({ timeout: 0 });
    }
  });
});
