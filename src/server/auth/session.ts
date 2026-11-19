import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_HOURS,
  AUTH_SESSION_COOKIE,
  CUSTOMER_SESSION_TTL_DAYS,
} from '@/shared/constants';
import type { AuthProvider, SessionUser, UserRole } from '@/shared/types';
import { AppError } from '../http/errors';

const SESSION_AUDIENCE = 'techcore-session';
const VALID_ROLES = new Set<UserRole>(['customer', 'admin']);
const VALID_PROVIDERS = new Set<AuthProvider>(['password', 'google', 'facebook', 'admin']);

export function getAuthSecretString(): string {
  const secret = (process.env.AUTH_SECRET ?? '').trim();
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new AppError('INTERNAL', {
      status: 500,
      message: 'Cấu hình bảo mật máy chủ chưa hợp lệ.',
    });
  }
  return secret;
}

export function getJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecretString());
}

export function readCookieFromRequest(request: NextRequest, name: string): string | null {
  const fromCookies = request.cookies?.get(name)?.value;
  if (fromCookies) {
    return fromCookies;
  }
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const eqIndex = part.indexOf('=');
    if (eqIndex < 0) continue;
    if (part.slice(0, eqIndex).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eqIndex + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function createAdminSessionUser(): SessionUser {
  return {
    id: 'admin',
    role: 'admin',
    username: 'admin',
    displayName: 'Quản trị viên',
    avatarUrl: null,
    provider: 'admin',
  };
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  const ttlHours =
    user.role === 'admin' ? ADMIN_SESSION_TTL_HOURS : CUSTOMER_SESSION_TTL_DAYS * 24;

  return new SignJWT({
    role: user.role,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlHours}h`)
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
      audience: SESSION_AUDIENCE,
    });
    const id = typeof payload.sub === 'string' ? payload.sub : '';
    const role = payload.role as UserRole;
    const provider = payload.provider as AuthProvider;
    const displayName = typeof payload.displayName === 'string' ? payload.displayName : '';

    if (
      !id ||
      !VALID_ROLES.has(role) ||
      !VALID_PROVIDERS.has(provider) ||
      !displayName
    ) {
      return null;
    }

    return {
      id,
      role,
      username: typeof payload.username === 'string' ? payload.username : null,
      displayName,
      avatarUrl: typeof payload.avatarUrl === 'string' ? payload.avatarUrl : null,
      provider,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = readCookieFromRequest(request, AUTH_SESSION_COOKIE);
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export async function requireSession(request: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new AppError('UNAUTHORIZED');
  }
  return user;
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const user = await getSessionUser(request);
  return user?.role === 'admin';
}

export async function requireAdmin(request: NextRequest): Promise<SessionUser> {
  const user = await requireSession(request);
  if (user.role !== 'admin') {
    throw new AppError('UNAUTHORIZED');
  }
  return user;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  role: UserRole,
): void {
  const maxAgeSeconds =
    role === 'admin'
      ? ADMIN_SESSION_TTL_HOURS * 60 * 60
      : CUSTOMER_SESSION_TTL_DAYS * 24 * 60 * 60;

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  const expiredBase = {
    value: '',
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  };
  response.cookies.set({ name: AUTH_SESSION_COOKIE, ...expiredBase });
  response.cookies.set({ name: ADMIN_SESSION_COOKIE, ...expiredBase });
}
