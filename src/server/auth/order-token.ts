import 'server-only';

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { ORDER_TOKEN_TTL_HOURS } from '@/shared/constants';
import { getJwtSecretKey } from './admin-session';

const ORDER_AUDIENCE = 'order';

export async function signOrderAccessToken(orderId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(orderId)
    .setAudience(ORDER_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ORDER_TOKEN_TTL_HOURS}h`)
    .sign(getJwtSecretKey());
}

export async function verifyOrderAccessToken(
  token: string,
  expectedOrderId: string,
): Promise<boolean> {
  if (!token) {
    return false;
  }
  try {
    await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ['HS256'],
      audience: ORDER_AUDIENCE,
      subject: expectedOrderId,
    });
    return true;
  } catch {
    return false;
  }
}

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}
