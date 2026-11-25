import { NextRequest, NextResponse } from 'next/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GET as getProvinces } from '@/app/api/address/provinces/route';
import { GET as getWards } from '@/app/api/address/provinces/[code]/wards/route';
import { GET as getAuthSession } from '@/app/api/auth/session/route';
import { POST as postAuthLogout } from '@/app/api/auth/logout/route';
import { createAdminSessionUser, signSessionToken } from '@/server/auth/session';
import { signOrderAccessToken } from '@/server/auth/order-token';
import { AppError } from '@/server/http/errors';
import { parseJsonBody, withHandler } from '@/server/http/handler';
import {
  assertCartEnvelope,
  parseCommaListParam,
  parseStrictBoolParam,
  parseStrictIntListParam,
  parseStrictIntParam,
  requireOrderViewer,
} from '@/server/http/route-helpers';
import { AUTH_SESSION_COOKIE, MAX_JSON_BYTES } from '@/shared/constants';
import { z } from 'zod';
import { ensureTestAuthSecret } from '../../helpers/test-db';

beforeAll(() => {
  ensureTestAuthSecret();
});

describe('http/route-helpers & handler & stateless route handlers', () => {
  it('parses query params and cart envelopes strictly', () => {
    expect(parseCommaListParam(null)).toBeUndefined();
    expect(parseCommaListParam(' , ')).toBeUndefined();
    expect(parseCommaListParam('intel, amd')).toEqual(['intel', 'amd']);

    expect(parseStrictIntParam(null)).toBeUndefined();
    expect(parseStrictIntParam('  ')).toBeUndefined();
    expect(parseStrictIntParam('5000')).toBe(5000);
    expect(Number.isNaN(parseStrictIntParam('12abc'))).toBe(true);

    expect(parseStrictBoolParam(null)).toBeUndefined();
    expect(parseStrictBoolParam('  ')).toBeUndefined();
    expect(parseStrictBoolParam('true')).toBe(true);
    expect(parseStrictBoolParam(' false ')).toBe(false);
    expect(parseStrictBoolParam('yes')).toBe('yes');

    expect(parseStrictIntListParam('8, 16')).toEqual([8, 16]);
    expect(parseStrictIntListParam('8, bad')?.map((n) => Number.isNaN(n))).toEqual([false, true]);

    expect(() => assertCartEnvelope({ items: [] }, { allowEmpty: false })).toThrowError(
      AppError,
    );
    expect(() => assertCartEnvelope({ items: [] }, { allowEmpty: true })).not.toThrow();
    expect(() =>
      assertCartEnvelope(
        { items: Array.from({ length: 21 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 })) },
        { allowEmpty: true },
      ),
    ).toThrowError(AppError);
  });

  it('authorizes order viewer via admin cookie or scoped order Bearer token', async () => {
    const orderId = 'PC-7K3M9QX2TB';
    const orderToken = await signOrderAccessToken(orderId);
    const adminToken = await signSessionToken(createAdminSessionUser());

    await expect(
      requireOrderViewer(
        new NextRequest(`https://shop.example.com/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${orderToken}` },
        }),
        orderId,
      ),
    ).resolves.toBeUndefined();

    await expect(
      requireOrderViewer(
        new NextRequest(`https://shop.example.com/api/orders/${orderId}`, {
          headers: { cookie: `${AUTH_SESSION_COOKIE}=${adminToken}` },
        }),
        orderId,
      ),
    ).resolves.toBeUndefined();

    await expect(
      requireOrderViewer(
        new NextRequest(`https://shop.example.com/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${orderToken}` },
        }),
        'PC-WRONGORDER',
      ),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
  });

  it('handles JSON body limits, Zod errors, DB unavailable 503, and unexpected errors', async () => {
    const oversized = JSON.stringify({ text: 'a'.repeat(MAX_JSON_BYTES + 10) });
    const overReq = new NextRequest('https://shop.example.com/api/test', {
      method: 'POST',
      body: oversized,
    });
    await expect(parseJsonBody(overReq)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });

    const badJsonReq = new NextRequest('https://shop.example.com/api/test', {
      method: 'POST',
      body: '{invalid',
    });
    await expect(parseJsonBody(badJsonReq)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    });

    const zodHandler = withHandler({}, async () => {
      z.object({ count: z.number() }).parse({ count: 'nope' });
      return NextResponse.json({ ok: true });
    });
    const zodRes = await zodHandler(new NextRequest('https://shop.example.com/api/test'), {});
    expect(zodRes.status).toBe(400);

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const dbDownHandler = withHandler({}, async () => {
      throw Object.assign(new Error('down'), { code: 'ECONNREFUSED' });
    });
    const dbDownRes = await dbDownHandler(new NextRequest('https://shop.example.com/api/test'), {});
    expect(dbDownRes.status).toBe(503);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('serves cacheable address endpoints and unified auth session/logout endpoints', async () => {
    const provRes = await getProvinces(new NextRequest('https://shop.example.com/api/address/provinces'), {});
    expect(provRes.status).toBe(200);
    expect(provRes.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
    expect(await provRes.json()).toHaveLength(34);

    const wardsOk = await getWards(
      new NextRequest('https://shop.example.com/api/address/provinces/01/wards'),
      { params: Promise.resolve({ code: '01' }) },
    );
    expect(wardsOk.status).toBe(200);
    expect(wardsOk.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');

    const wardsMissing = await getWards(
      new NextRequest('https://shop.example.com/api/address/provinces/999/wards'),
      { params: Promise.resolve({ code: '999' }) },
    );
    expect(wardsMissing.status).toBe(404);
    expect(wardsMissing.headers.get('cache-control')).toBe('no-store');

    const anonSession = await getAuthSession(
      new NextRequest('https://shop.example.com/api/auth/session'),
      {},
    );
    expect(anonSession.status).toBe(200);
    expect(await anonSession.json()).toMatchObject({ user: null });

    const adminToken = await signSessionToken(createAdminSessionUser());
    const authSession = await getAuthSession(
      new NextRequest('https://shop.example.com/api/auth/session', {
        headers: { cookie: `${AUTH_SESSION_COOKIE}=${adminToken}` },
      }),
      {},
    );
    expect(await authSession.json()).toMatchObject({ user: { role: 'admin' } });

    const logoutRes = await postAuthLogout(
      new NextRequest('https://shop.example.com/api/auth/logout', {
        method: 'POST',
        headers: { origin: 'https://shop.example.com' },
      }),
      {},
    );
    expect(logoutRes.status).toBe(204);
    expect(logoutRes.headers.get('set-cookie')).toContain(`${AUTH_SESSION_COOKIE}=;`);
  });
});
