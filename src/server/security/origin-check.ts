import 'server-only';

import type { NextRequest } from 'next/server';
import { AppError } from '../http/errors';

function firstHeaderValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first || null;
}

export function resolveDeploymentOrigin(request: NextRequest): string {
  const parsedUrl = new URL(request.url);
  const host = firstHeaderValue(request.headers.get('x-forwarded-host')) ?? firstHeaderValue(request.headers.get('host'));
  if (!host) {
    return parsedUrl.origin;
  }
  const proto =
    firstHeaderValue(request.headers.get('x-forwarded-proto')) ??
    parsedUrl.protocol.replace(/:$/, '');
  return `${proto}://${host}`;
}

export function assertSameOrigin(request: NextRequest): void {
  const origin = request.headers.get('origin');
  const expectedOrigin = resolveDeploymentOrigin(request);
  if (!origin || origin !== expectedOrigin) {
    throw new AppError('FORBIDDEN_ORIGIN');
  }
}
