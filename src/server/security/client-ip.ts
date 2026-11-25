import 'server-only';

import { createHmac } from 'node:crypto';
import { ipAddress } from '@vercel/functions';
import type { NextRequest } from 'next/server';
import { getAuthSecretString } from '../auth/session';

export function getClientIp(request: NextRequest): string {
  const fromVercel = ipAddress(request);
  if (fromVercel) {
    return fromVercel;
  }
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return 'unknown';
}

export function hashClientIp(ip: string): string {
  return createHmac('sha256', getAuthSecretString()).update(ip).digest('hex');
}

export function getClientIpHash(request: NextRequest): string {
  return hashClientIp(getClientIp(request));
}
