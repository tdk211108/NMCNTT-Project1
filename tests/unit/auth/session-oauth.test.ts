import { NextRequest, NextResponse } from 'next/server';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  buildFacebookAuthUrl,
  buildGoogleAuthUrl,
  computeFacebookAppSecretProof,
  createPkcePair,
  exchangeFacebookCode,
  exchangeGoogleCode,
  sanitizeHttpsUrl,
  sanitizeNextPath,
  signOAuthTxToken,
  verifyOAuthTxToken,
} from '@/server/auth/oauth';
import {
  clearSessionCookie,
  createAdminSessionUser,
  getSessionUser,
  requireAdmin,
  requireSession,
  setSessionCookie,
  signSessionToken,
  verifySessionToken,
} from '@/server/auth/session';
import { ADMIN_SESSION_COOKIE, AUTH_SESSION_COOKIE } from '@/shared/constants';
import { ensureTestAuthSecret } from '../../helpers/test-db';

beforeAll(() => {
  ensureTestAuthSecret();
});

describe('auth/session & oauth helpers', () => {
  it('signs, verifies, sets and clears unified session cookies', async () => {
    const customer = {
      id: '11111111-1111-4111-8111-111111111111',
      role: 'customer' as const,
      username: 'khach1',
      displayName: 'Khách Một',
      avatarUrl: null,
      provider: 'password' as const,
    };
    const admin = createAdminSessionUser();

    const customerToken = await signSessionToken(customer);
    const adminToken = await signSessionToken(admin);

    expect(await verifySessionToken(customerToken)).toEqual(customer);
    expect(await verifySessionToken(adminToken)).toEqual(admin);
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken(`${customerToken}tamper`)).toBeNull();

    const customerReq = new NextRequest('https://techcore.vn/api/orders/mine', {
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${encodeURIComponent(customerToken)}` },
    });
    expect(await getSessionUser(customerReq)).toEqual(customer);
    await expect(requireSession(customerReq)).resolves.toEqual(customer);
    await expect(requireAdmin(customerReq)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });

    const adminReq = new NextRequest('https://techcore.vn/api/admin/products', {
      headers: { cookie: `${AUTH_SESSION_COOKIE}=${encodeURIComponent(adminToken)}` },
    });
    await expect(requireAdmin(adminReq)).resolves.toEqual(admin);

    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, customerToken, 'customer');
    const setCookieHeader = res.headers.get('set-cookie') ?? '';
    expect(setCookieHeader).toContain(`${AUTH_SESSION_COOKIE}=`);
    expect(setCookieHeader.toLowerCase()).toContain('httponly');
    expect(setCookieHeader.toLowerCase()).toContain('samesite=lax');

    const cleared = NextResponse.json({ ok: true });
    clearSessionCookie(cleared);
    const clearedHeader = cleared.headers.get('set-cookie') ?? '';
    expect(clearedHeader).toContain(`${AUTH_SESSION_COOKIE}=;`);
    expect(clearedHeader).toContain(`${ADMIN_SESSION_COOKIE}=;`);
  });

  it('sanitizes OAuth redirect paths and avatar URLs safely', () => {
    expect(sanitizeNextPath('/checkout')).toBe('/checkout');
    expect(sanitizeNextPath('/orders?tab=1')).toBe('/orders?tab=1');
    expect(sanitizeNextPath('//evil.com')).toBe('/');
    expect(sanitizeNextPath('/\\evil.com')).toBe('/');
    expect(sanitizeNextPath('https://evil.com')).toBe('/');
    expect(sanitizeNextPath('')).toBe('/');
    expect(sanitizeNextPath(null)).toBe('/');

    expect(sanitizeHttpsUrl('https://lh3.googleusercontent.com/a/avatar')).toBe(
      'https://lh3.googleusercontent.com/a/avatar',
    );
    expect(sanitizeHttpsUrl('http://insecure.example.com/a.png')).toBeNull();
    expect(sanitizeHttpsUrl('javascript:alert(1)')).toBeNull();
  });

  it('signs/verifies OAuth transaction state and builds provider auth URLs', async () => {
    const pkce = createPkcePair();
    expect(pkce.codeVerifier.length).toBeGreaterThan(20);
    expect(pkce.codeChallenge.length).toBeGreaterThan(20);

    const txToken = await signOAuthTxToken({
      provider: 'google',
      state: 'state-123',
      codeVerifier: pkce.codeVerifier,
      next: '/checkout',
    });
    expect(await verifyOAuthTxToken(txToken)).toEqual({
      provider: 'google',
      state: 'state-123',
      codeVerifier: pkce.codeVerifier,
      next: '/checkout',
    });
    expect(await verifyOAuthTxToken('bad-token')).toBeNull();

    const gUrl = new URL(
      buildGoogleAuthUrl({
        clientId: 'g-id',
        redirectUri: 'https://techcore.vn/api/auth/oauth/google/callback',
        state: 's1',
        codeChallenge: pkce.codeChallenge,
      }),
    );
    expect(gUrl.origin).toBe('https://accounts.google.com');
    expect(gUrl.searchParams.get('code_challenge_method')).toBe('S256');

    const fbUrl = new URL(
      buildFacebookAuthUrl({
        clientId: 'fb-id',
        redirectUri: 'https://techcore.vn/api/auth/oauth/facebook/callback',
        state: 's2',
      }),
    );
    expect(fbUrl.origin).toBe('https://www.facebook.com');
    expect(fbUrl.searchParams.get('scope')).toBe('public_profile');
    expect(computeFacebookAppSecretProof('tok', 'sec')).toHaveLength(64);
  });

  it('exchanges Google and Facebook OAuth codes using injected fetch', async () => {
    const googleFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'g-access' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            sub: 'google-sub-1',
            name: 'Nguyen Google',
            email: 'USER@EXAMPLE.COM',
            email_verified: true,
            picture: 'https://lh3.googleusercontent.com/avatar.png',
          }),
          { status: 200 },
        ),
      );

    const gProfile = await exchangeGoogleCode(
      {
        code: 'code-1',
        redirectUri: 'https://techcore.vn/api/auth/oauth/google/callback',
        codeVerifier: 'verifier',
        credentials: { clientId: 'cid', clientSecret: 'csec' },
      },
      googleFetch,
    );
    expect(gProfile).toEqual({
      provider: 'google',
      providerAccountId: 'google-sub-1',
      displayName: 'Nguyen Google',
      email: 'user@example.com',
      emailVerified: true,
      avatarUrl: 'https://lh3.googleusercontent.com/avatar.png',
    });

    const fbFetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'fb-access' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'fb-id-1',
            name: 'Nguyen Facebook',
            picture: { data: { url: 'https://graph.facebook.com/avatar.jpg' } },
          }),
          { status: 200 },
        ),
      );

    const fbProfile = await exchangeFacebookCode(
      {
        code: 'code-2',
        redirectUri: 'https://techcore.vn/api/auth/oauth/facebook/callback',
        credentials: { clientId: 'fbid', clientSecret: 'fbsec' },
      },
      fbFetch,
    );
    expect(fbProfile).toEqual({
      provider: 'facebook',
      providerAccountId: 'fb-id-1',
      displayName: 'Nguyen Facebook',
      email: null,
      emailVerified: false,
      avatarUrl: 'https://graph.facebook.com/avatar.jpg',
    });
  });
});
