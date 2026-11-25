import 'server-only';

import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { CART_MAX_ITEMS } from '@/shared/constants';
import { extractBearerToken, verifyOrderAccessToken } from '../auth/order-token';
import { getSessionUser } from '../auth/session';
import { getDb, type DbClient } from '../db/client';
import { orders } from '../db/schema';
import { AppError } from './errors';

export function parseCommaListParam(value: string | null): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const items = value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return items.length > 0 ? items : undefined;
}

export function parseStrictIntParam(value: string | null): number | undefined {
  if (value === null || value.trim() === '') {
    return undefined;
  }
  if (!/^-?\d+$/.test(value.trim())) {
    return Number.NaN;
  }
  return Number(value.trim());
}

export function parseStrictBoolParam(value: string | null): boolean | string | undefined {
  if (value === null || value.trim() === '') {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

export function parseStrictIntListParam(value: string | null): number[] | undefined {
  const parts = parseCommaListParam(value);
  if (!parts) {
    return undefined;
  }
  return parts.map((p) => (/^-?\d+$/.test(p) ? Number(p) : Number.NaN));
}

export function assertCartEnvelope(
  body: unknown,
  options: { allowEmpty: boolean },
): void {
  if (!body || typeof body !== 'object' || !('items' in body)) {
    return;
  }
  const items = (body as { items?: unknown }).items;
  if (!Array.isArray(items)) {
    return;
  }
  if (!options.allowEmpty && items.length === 0) {
    throw new AppError('EMPTY_CART');
  }
  if (items.length > CART_MAX_ITEMS) {
    throw new AppError('CART_LIMIT_EXCEEDED');
  }
}

export async function requireOrderViewer(
  request: NextRequest,
  orderId: string,
  db?: DbClient,
): Promise<void> {
  const session = await getSessionUser(request);
  if (session?.role === 'admin') {
    return;
  }
  if (session?.role === 'customer') {
    const resolvedDb = db ?? getDb();
    const [owned] = await resolvedDb
      .select({ userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (owned && owned.userId === session.id) {
      return;
    }
  }
  const bearer = extractBearerToken(request);
  if (!bearer || !(await verifyOrderAccessToken(bearer, orderId))) {
    throw new AppError('UNAUTHORIZED');
  }
}
