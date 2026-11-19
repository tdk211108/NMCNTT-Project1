import 'server-only';

import { inArray } from 'drizzle-orm';
import type { CartItemInput, CartLine, CartQuote, RemovedItem } from '@/shared/types';
import { getDb, type DbExecutor } from '../db/client';
import { products } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { computeLineTotalVnd, validateCartItems } from '../domain/cart-rules';
import { calculateCartTotals } from '../domain/shipping';
import { AppError } from '../http/errors';

export async function quoteCart(
  items: readonly CartItemInput[],
  db: DbExecutor = getDb(),
): Promise<CartQuote> {
  const ruleResult = validateCartItems(items, { allowEmpty: true });
  if (!ruleResult.ok) {
    throw new AppError(ruleResult.code);
  }

  if (items.length === 0) {
    return {
      lines: [],
      removed: [],
      ...calculateCartTotals([]),
    };
  }

  const productIds = items.map((item) => item.productId);

  const [activeRows, allProductRows] = await Promise.all([
    db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        category: storefrontProductsV.category,
        imageUrl: storefrontProductsV.imageUrl,
        priceVnd: storefrontProductsV.priceVnd,
      })
      .from(storefrontProductsV)
      .where(inArray(storefrontProductsV.id, productIds)),
    db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(inArray(products.id, productIds)),
  ]);

  const activeById = new Map(activeRows.map((row) => [row.id, row]));
  const nameById = new Map(allProductRows.map((row) => [row.id, row.name]));

  const lines: CartLine[] = [];
  const removed: RemovedItem[] = [];

  for (const item of items) {
    const active = activeById.get(item.productId);
    if (!active) {
      removed.push({
        productId: item.productId,
        name: nameById.get(item.productId) ?? null,
      });
      continue;
    }

    const priceChange =
      item.knownUnitPriceVnd !== null &&
      item.knownUnitPriceVnd !== undefined &&
      item.knownUnitPriceVnd !== active.priceVnd
        ? { fromVnd: item.knownUnitPriceVnd, toVnd: active.priceVnd }
        : null;

    lines.push({
      productId: active.id,
      name: active.name,
      category: active.category,
      imageUrl: active.imageUrl,
      unitPriceVnd: active.priceVnd,
      quantity: item.quantity,
      lineTotalVnd: computeLineTotalVnd(active.priceVnd, item.quantity),
      priceChange,
    });
  }

  return {
    lines,
    removed,
    ...calculateCartTotals(lines),
  };
}
