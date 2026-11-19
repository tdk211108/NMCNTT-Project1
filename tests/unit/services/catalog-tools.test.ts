import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { DbClient } from '@/server/db/client';
import { products } from '@/server/db/schema';
import {
  getFeaturedProducts,
  getProductDetail,
  listProducts,
  resolveProducts,
} from '@/server/services/catalog.service';
import { compareProducts } from '@/server/services/compare.service';
import { getPerfPerPriceRanking } from '@/server/services/perf-per-price.service';
import { estimatePsu, getPsuOptions } from '@/server/services/psu.service';
import { suggestProducts } from '@/server/services/search.service';
import { createAdminGpuSeries } from '@/server/services/admin-catalog.service';
import { closeTestDb, getTestDb, resetAndSeedTestDb } from '../../helpers/test-db';

let db: DbClient;

beforeAll(async () => {
  db = await getTestDb();
});

beforeEach(async () => {
  await resetAndSeedTestDb(db);
});

afterAll(async () => {
  await closeTestDb();
});

describe('services/catalog, search, compare, perf-per-price, psu (Postgres 16)', () => {
  it('lists retail products with category-wide facets, dynamic normalized scores, and filtering', async () => {
    const allCpus = await listProducts({ category: 'cpu' }, db);
    expect(allCpus.total).toBe(35);
    expect(allCpus.facets.vendors).toEqual(['amd', 'intel']);
    expect(allCpus.facets.sockets).toEqual(['AM5', 'LGA1700', 'LGA1851']);
    expect(allCpus.facets.priceRange).not.toBeNull();

    // Filtering by vendor & socket still keeps facets over the whole active CPU category
    const filtered = await listProducts(
      {
        category: 'cpu',
        vendor: ['amd'],
        socket: ['AM5'],
        sort: 'score_desc',
        q: '9950x3d',
      },
      db,
    );
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0].id).toBe('cpu-amd-ryzen-9-9950x3d');
    expect(filtered.items[0].score.normalized).toBe(100);
    expect(filtered.facets.vendors).toEqual(['amd', 'intel']);

    // Escapes SQL ILIKE wildcards (`%`, `_`) so they do not match everything
    const wildcard = await listProducts({ category: 'cpu', q: '100%_' }, db);
    expect(wildcard.total).toBe(0);

    // Zero active products in category returns empty list and null priceRange (C22)
    await db.update(products).set({ deletedAt: new Date() }).where(eq(products.category, 'cpu'));
    const emptyCategory = await listProducts({ category: 'cpu' }, db);
    expect(emptyCategory.items).toEqual([]);
    expect(emptyCategory.facets.priceRange).toBeNull();

    // GPU listing supports filtering Limited Edition while keeping all 71 in the All tab
    const allGpus = await listProducts({ category: 'gpu' }, db);
    expect(allGpus.total).toBe(71);
    const limitedGpus = await listProducts({ category: 'gpu', limitedEdition: true }, db);
    expect(limitedGpus.total).toBe(8);
    expect(limitedGpus.items.every((g) => g.isLimitedEdition)).toBe(true);
  });

  it('builds balanced multi-vendor 8+8 featured catalog excluding soft-deleted products', async () => {
    const featured = await getFeaturedProducts(undefined, db);
    expect(featured.cpus).toHaveLength(8);
    expect(featured.gpus).toHaveLength(8);

    const cpuVendors = new Set(featured.cpus.map((c) => c.vendor));
    const gpuVendors = new Set(featured.gpus.map((g) => g.vendor));
    expect(cpuVendors).toEqual(new Set(['intel', 'amd']));
    expect(gpuVendors).toEqual(new Set(['nvidia', 'amd']));

    // Soft-deleting the top flagship removes it from featured results cleanly
    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, featured.cpus[0].id));
    const refreshed = await getFeaturedProducts(undefined, db);
    expect(refreshed.cpus).toHaveLength(8);
    expect(refreshed.cpus.some((c) => c.id === featured.cpus[0].id)).toBe(false);
  });

  it('loads product detail with stockStatus=in_stock and resolves active vs soft-deleted items', async () => {
    const cpuDetail = await getProductDetail('cpu-amd-ryzen-7-9800x3d', db);
    expect(cpuDetail.stockStatus).toBe('in_stock');
    expect(cpuDetail.warrantyMonths).toBe(36);
    expect(cpuDetail.packaging).toBe('full_box');
    expect(cpuDetail.psuPrefill).toEqual({ cpu: 'store:cpu-amd-ryzen-7-9800x3d' });

    const gpuDetail = await getProductDetail('gpu-asus-rog-astral-rtx-5090-32gb-oc', db);
    expect(gpuDetail.stockStatus).toBe('in_stock');
    expect(gpuDetail.specGroups.map((g) => g.key)).toEqual(['specs', 'physical', 'outputs']);
    expect(gpuDetail.series).toEqual({ id: 'gs-rtx-5090', name: 'NVIDIA GeForce RTX 5090' });
    expect(gpuDetail.psuPrefill).toEqual({ gpu: 'gs-rtx-5090' });

    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, 'cpu-intel-core-i3-12100f'));

    await expect(getProductDetail('cpu-intel-core-i3-12100f', db)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });

    const resolved = await resolveProducts(
      ['cpu-amd-ryzen-7-9800x3d', 'cpu-intel-core-i3-12100f', 'nonexistent-id'],
      db,
    );
    expect(resolved.active.map((a) => a.id)).toEqual(['cpu-amd-ryzen-7-9800x3d']);
    expect(resolved.removed).toEqual([
      { productId: 'cpu-intel-core-i3-12100f', name: 'Intel Core i3-12100F' },
      { productId: 'nonexistent-id', name: null },
    ]);
  });

  it('returns search suggestions ordered by name prefix then normalized score', async () => {
    const suggestions = await suggestProducts('rtx 5090', db);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(8);

    const noWildcardHit = await suggestProducts('%%%_', db);
    expect(noWildcardHit).toEqual([]);
  });

  it('compares same-category products and enforces compare validation errors', async () => {
    const valid = await compareProducts(
      'cpu-amd-ryzen-7-9800x3d,cpu-intel-core-ultra-9-285k',
      db,
    );
    expect(valid.category).toBe('cpu');
    expect(valid.products).toHaveLength(2);
    expect(valid.rows).toHaveLength(11);
    expect(valid.notes).toHaveLength(2);

    await expect(compareProducts('', db)).rejects.toMatchObject({
      code: 'COMPARE_INVALID',
      status: 422,
      details: { reason: 'NO_IDS' },
    });

    await expect(
      compareProducts(
        'cpu-amd-ryzen-7-9800x3d,gpu-asus-rog-astral-rtx-5090-32gb-oc',
        db,
      ),
    ).rejects.toMatchObject({
      code: 'COMPARE_INVALID',
      details: { reason: 'MIXED_CATEGORY' },
    });

    await expect(compareProducts('cpu-amd-ryzen-7-9800x3d,missing-id', db)).rejects.toMatchObject({
      code: 'COMPARE_INVALID',
      details: { reason: 'NOT_FOUND', invalidIds: ['missing-id'] },
    });
  });

  it('ranks active products by performance-per-price and handles low-budget empty state', async () => {
    const ranking = await getPerfPerPriceRanking(
      { category: 'cpu', vendor: ['amd'], maxPriceVnd: 15_000_000 },
      db,
    );
    expect(ranking.items.length).toBeGreaterThan(0);
    expect(ranking.items[0].bestValue).toBe(true);
    expect(ranking.items.every((i) => i.vendor === 'amd' && i.priceVnd <= 15_000_000)).toBe(true);

    const emptyBudget = await getPerfPerPriceRanking(
      { category: 'gpu', maxPriceVnd: 100_000 },
      db,
    );
    expect(emptyBudget.items).toEqual([]);
  });

  it('builds PSU options excluding retail series with zero active variants and estimates wattage', async () => {
    await createAdminGpuSeries(
      {
        kind: 'retail',
        name: 'NVIDIA Empty Test Series',
        vendor: 'nvidia',
        vramGb: 16,
        tbpW: 250,
        cores: 5000,
        baseClockMhz: 2000,
        boostClockMhz: 2400,
        memoryType: 'GDDR7',
        busWidthBit: 256,
        passmarkRaw: 25000,
        passmarkSource: 'PassMark',
      },
      db,
    );

    const options = await getPsuOptions(db);
    expect(options.cpus.some((c) => c.id === 'store:cpu-amd-ryzen-7-9800x3d')).toBe(true);
    expect(options.cpus.some((c) => c.id === 'legacy:C01')).toBe(true);
    expect(options.gpus.some((g) => g.id === 'gs-rtx-5090')).toBe(true);
    expect(options.gpus.some((g) => g.id === 'G01')).toBe(true);
    expect(options.gpus.some((g) => g.id === 'gs-nvidia-empty-test-series')).toBe(false);

    await expect(
      estimatePsu('store:cpu-amd-ryzen-7-9800x3d', 'gs-nvidia-empty-test-series', db),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });

    const estimate = await estimatePsu('legacy:C01', 'gs-rtx-5090', db);
    // (250 + 575 + 100) * 1.25 = 1156.25 -> 1200W
    expect(estimate.exactW).toBe(1156.25);
    expect(estimate.recommendedTierW).toBe(1200);
    expect(estimate.exceedsMaxTier).toBe(false);
  });
});
