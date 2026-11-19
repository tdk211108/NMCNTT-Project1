import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';
import {
  clearSessionCookie,
  createAdminSessionUser,
  getAuthSecretString,
  getJwtSecretKey,
  isAdminRequest,
  readCookieFromRequest,
  requireAdmin as requireAdminSession,
  setSessionCookie,
  signSessionToken,
  verifySessionToken,
} from './session';

export {
  getAuthSecretString,
  getJwtSecretKey,
  readCookieFromRequest,
  isAdminRequest,
};

export async function signAdminSessionToken(): Promise<string> {
  return signSessionToken(createAdminSessionUser());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  const user = await verifySessionToken(token);
  return user?.role === 'admin';
}

export async function requireAdmin(request: NextRequest): Promise<void> {
  await requireAdminSession(request);
}

export function setAdminSessionCookie(response: NextResponse, token: string): void {
  setSessionCookie(response, token, 'admin');
}

export function clearAdminSessionCookie(response: NextResponse): void {
  clearSessionCookie(response);
}
