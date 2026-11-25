import 'server-only';

import { eq, inArray } from 'drizzle-orm';
import type { CartItemInput, CartLine, CartQuote, RemovedItem } from '@/shared/types';
import { getDb, type DbExecutor } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, products } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import {
  EMPTY_CART_ADVISORIES,
  evaluateCartAdvisories,
  type CartAdvisorySpecInput,
} from '../domain/cart-advisories';
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
      advisories: EMPTY_CART_ADVISORIES,
      ...calculateCartTotals([]),
    };
  }

  const productIds = items.map((item) => item.productId);

  const activeRows = await db
    .select({
      id: storefrontProductsV.id,
      name: storefrontProductsV.name,
      category: storefrontProductsV.category,
      imageUrl: storefrontProductsV.imageUrl,
      priceVnd: storefrontProductsV.priceVnd,
      socket: storefrontProductsV.socket,
      seriesId: storefrontProductsV.seriesId,
      normalizedScore: storefrontProductsV.normalizedScore,
      cpuPsuPowerW: cpuSpecs.psuPowerW,
      cpuRamSupport: cpuSpecs.ramSupport,
      gpuLengthMm: gpuVariants.lengthMm,
      gpuSlotThickness: gpuVariants.slotThickness,
      gpuTbpW: gpuSeries.tbpW,
    })
    .from(storefrontProductsV)
    .leftJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
    .leftJoin(gpuVariants, eq(gpuVariants.productId, storefrontProductsV.id))
    .leftJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
    .where(inArray(storefrontProductsV.id, productIds));

  const activeById = new Map(activeRows.map((row) => [row.id, row]));
  const missingIds = [...new Set(productIds.filter((id) => !activeById.has(id)))];
  const rawProductRows =
    missingIds.length > 0
      ? await db
          .select({
            id: products.id,
            name: products.name,
          })
          .from(products)
          .where(inArray(products.id, missingIds))
      : [];

  const nameById = new Map(rawProductRows.map((row) => [row.id, row.name]));

  const lines: CartLine[] = [];
  const removed: RemovedItem[] = [];
  const advisorySpecs: CartAdvisorySpecInput[] = [];

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

    if (active.category === 'cpu') {
      advisorySpecs.push({
        category: 'cpu',
        productId: active.id,
        name: active.name,
        quantity: item.quantity,
        socket: active.socket ?? '',
        ramSupport: active.cpuRamSupport ?? '',
        psuPowerW: active.cpuPsuPowerW ?? 0,
        normalizedScore: Number(active.normalizedScore),
      });
    } else {
      advisorySpecs.push({
        category: 'gpu',
        productId: active.id,
        name: active.name,
        quantity: item.quantity,
        seriesId: active.seriesId ?? '',
        tbpW: active.gpuTbpW ?? 0,
        lengthMm: active.gpuLengthMm ?? 0,
        slotThickness: Number(active.gpuSlotThickness ?? 0),
        normalizedScore: Number(active.normalizedScore),
      });
    }
  }

  return {
    lines,
    removed,
    advisories: evaluateCartAdvisories(advisorySpecs),
    ...calculateCartTotals(lines),
  };
}
