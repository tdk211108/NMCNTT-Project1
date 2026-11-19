import 'server-only';

import { createHash, createHmac, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import { OAUTH_TX_COOKIE, OAUTH_TX_TTL_MINUTES } from '@/shared/constants';
import type { OAuthProvider } from '@/shared/types';
import { resolveDeploymentOrigin } from '../security/origin-check';
import { getJwtSecretKey } from './session';

const OAUTH_TX_AUDIENCE = 'oauth-tx';
const OAUTH_FETCH_TIMEOUT_MS = 10_000;

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
}

export interface OAuthTransactionPayload {
  provider: OAuthProvider;
  state: string;
  codeVerifier?: string;
  next: string;
}

export interface OAuthUserProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  avatarUrl: string | null;
}

export function getOAuthCredentials(provider: OAuthProvider): OAuthCredentials | null {
  if (provider === 'google') {
    const clientId = (process.env.GOOGLE_CLIENT_ID ?? '').trim();
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET ?? '').trim();
    return clientId && clientSecret ? { clientId, clientSecret } : null;
  }
  const clientId = (process.env.FACEBOOK_CLIENT_ID ?? '').trim();
  const clientSecret = (process.env.FACEBOOK_CLIENT_SECRET ?? '').trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function getConfiguredOAuthProviders(): Record<OAuthProvider, boolean> {
  return {
    google: getOAuthCredentials('google') !== null,
    facebook: getOAuthCredentials('facebook') !== null,
  };
}

export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  const trimmed = raw.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    /[\u0000-\u001F\u007F]/.test(trimmed) ||
    trimmed.length > 200
  ) {
    return '/';
  }
  return trimmed;
}

export function sanitizeHttpsUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('https://') || trimmed.length > 500) {
    return null;
  }
  return trimmed;
}

export function buildOAuthCallbackUrl(request: NextRequest, provider: OAuthProvider): string {
  return `${resolveDeploymentOrigin(request)}/api/auth/oauth/${provider}/callback`;
}

export function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

export function generateOAuthState(): string {
  return randomBytes(24).toString('base64url');
}

export async function signOAuthTxToken(payload: OAuthTransactionPayload): Promise<string> {
  return new SignJWT({
    provider: payload.provider,
    state: payload.state,
    ...(payload.codeVerifier ? { codeVerifier: payload.codeVerifier } : {}),
    next: payload.next,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(OAUTH_TX_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_TX_TTL_MINUTES}m`)
    .sign(getJwtSecretKey());
}

export async function verifyOAuthTxToken(token: string): Promise<OAuthTransactionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
      audience: OAUTH_TX_AUDIENCE,
    });
    const provider = payload.provider;
    const state = payload.state;
    const next = payload.next;
    const codeVerifier = payload.codeVerifier;
    if (
      (provider !== 'google' && provider !== 'facebook') ||
      typeof state !== 'string' ||
      !state ||
      typeof next !== 'string'
    ) {
      return null;
    }
    return {
      provider,
      state,
      next: sanitizeNextPath(next),
      ...(typeof codeVerifier === 'string' ? { codeVerifier } : {}),
    };
  } catch {
    return null;
  }
}

export function setOAuthTxCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: OAUTH_TX_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth/oauth',
    secure: process.env.NODE_ENV === 'production',
    maxAge: OAUTH_TX_TTL_MINUTES * 60,
  });
}

export function clearOAuthTxCookie(response: NextResponse): void {
  response.cookies.set({
    name: OAUTH_TX_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth/oauth',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

export function buildGoogleAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export function buildFacebookAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const url = new URL('https://www.facebook.com/v21.0/dialog/oauth');
  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'public_profile');
  url.searchParams.set('state', params.state);
  return url.toString();
}

export async function exchangeGoogleCode(
  params: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
    credentials: OAuthCredentials;
  },
  fetchFn: typeof fetch = fetch,
): Promise<OAuthUserProfile> {
  const tokenRes = await fetchFn('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: params.code,
      client_id: params.credentials.clientId,
      client_secret: params.credentials.clientSecret,
      redirect_uri: params.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: params.codeVerifier,
    }),
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });

  if (!tokenRes.ok) {
    throw new Error('Google token exchange failed');
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: unknown };
  if (typeof tokenJson.access_token !== 'string' || !tokenJson.access_token) {
    throw new Error('Google access_token missing');
  }

  const userRes = await fetchFn('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });
  if (!userRes.ok) {
    throw new Error('Google userinfo fetch failed');
  }
  const userJson = (await userRes.json()) as {
    sub?: unknown;
    name?: unknown;
    email?: unknown;
    email_verified?: unknown;
    picture?: unknown;
  };
  if (typeof userJson.sub !== 'string' || !userJson.sub) {
    throw new Error('Google sub missing');
  }

  const email = typeof userJson.email === 'string' ? userJson.email.trim().toLowerCase() : null;
  const rawName = typeof userJson.name === 'string' ? userJson.name.trim() : '';
  const displayName = rawName.slice(0, 80) || email || 'Google User';

  return {
    provider: 'google',
    providerAccountId: userJson.sub,
    displayName,
    email,
    emailVerified: userJson.email_verified === true && Boolean(email),
    avatarUrl: sanitizeHttpsUrl(userJson.picture),
  };
}

export function computeFacebookAppSecretProof(accessToken: string, clientSecret: string): string {
  return createHmac('sha256', clientSecret).update(accessToken).digest('hex');
}

export async function exchangeFacebookCode(
  params: {
    code: string;
    redirectUri: string;
    credentials: OAuthCredentials;
  },
  fetchFn: typeof fetch = fetch,
): Promise<OAuthUserProfile> {
  const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', params.credentials.clientId);
  tokenUrl.searchParams.set('client_secret', params.credentials.clientSecret);
  tokenUrl.searchParams.set('redirect_uri', params.redirectUri);
  tokenUrl.searchParams.set('code', params.code);

  const tokenRes = await fetchFn(tokenUrl.toString(), {
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });
  if (!tokenRes.ok) {
    throw new Error('Facebook token exchange failed');
  }
  const tokenJson = (await tokenRes.json()) as { access_token?: unknown };
  if (typeof tokenJson.access_token !== 'string' || !tokenJson.access_token) {
    throw new Error('Facebook access_token missing');
  }

  const proof = computeFacebookAppSecretProof(
    tokenJson.access_token,
    params.credentials.clientSecret,
  );
  const meUrl = new URL('https://graph.facebook.com/v21.0/me');
  meUrl.searchParams.set('fields', 'id,name,picture.type(large)');
  meUrl.searchParams.set('access_token', tokenJson.access_token);
  meUrl.searchParams.set('appsecret_proof', proof);

  const meRes = await fetchFn(meUrl.toString(), {
    signal: AbortSignal.timeout(OAUTH_FETCH_TIMEOUT_MS),
  });
  if (!meRes.ok) {
    throw new Error('Facebook profile fetch failed');
  }
  const meJson = (await meRes.json()) as {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    picture?: { data?: { url?: unknown } };
  };
  if (typeof meJson.id !== 'string' || !meJson.id) {
    throw new Error('Facebook id missing');
  }

  const email = typeof meJson.email === 'string' ? meJson.email.trim().toLowerCase() : null;
  const rawName = typeof meJson.name === 'string' ? meJson.name.trim() : '';
  const displayName = rawName.slice(0, 80) || email || 'Facebook User';

  return {
    provider: 'facebook',
    providerAccountId: meJson.id,
    displayName,
    email,
    emailVerified: false,
    avatarUrl: sanitizeHttpsUrl(meJson.picture?.data?.url),
  };
}
