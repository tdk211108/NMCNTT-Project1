import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DbClient } from '@/server/db/client';
import { authFailures, gpuSeries } from '@/server/db/schema';
import {
  createAdminGpuSeries,
  createAdminLegacyCpu,
  createAdminProduct,
  listAdminGpuSeries,
  listAdminLegacyCpus,
  listAdminProducts,
  softDeleteAdminGpuSeries,
  softDeleteAdminProduct,
  updateAdminGpuSeries,
  updateAdminLegacyCpu,
  updateAdminProduct,
} from '@/server/services/admin-catalog.service';
import { getAdminOrderDetail, listAdminOrders } from '@/server/services/admin-order.service';
import { createOrder } from '@/server/services/order.service';
import { resetSampleData } from '@/server/services/reset.service';
import {
  closeTestDb,
  getTestDb,
  resetAndSeedTestDb,
  TEST_STORAGE_CONFIG,
} from '../../helpers/test-db';

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

describe('services/admin-catalog, admin-order, reset & DB triggers (Postgres 16)', () => {
  it('enforces cross-table CPU name uniqueness, facet canonicalization, and soft-delete ID avoidance', async () => {
    const created = await createAdminProduct(
      {
        category: 'cpu',
        name: 'Custom Test CPU',
        priceVnd: 7_500_000,
        image: { kind: 'none' },
        vendor: 'amd',
        architecture: 'Zen 5',
        socket: 'am5',
        processNode: 'TSMC 4nm',
        coresTotal: 8,
        threadsTotal: 16,
        pCores: null,
        eCores: null,
        baseClockGhz: 4.0,
        boostClockGhz: 5.0,
        cacheText: 'L3 32 MB',
        l3CacheMb: 32,
        tdpW: 65,
        psuPowerW: 90,
        ramSupport: 'DDR5-5600',
        passmarkRaw: 35000,
        passmarkSource: 'PassMark',
      },
      db,
    );
    expect(created.id).toBe('cpu-custom-test-cpu');
    expect(created.category === 'cpu' && created.socket).toBe('AM5');

    // Legacy CPU cannot reuse retail CPU name (C21)
    await expect(
      createAdminLegacyCpu(
        { name: 'custom test cpu', vendor: 'amd', psuPowerW: 90 },
        db,
      ),
    ).rejects.toMatchObject({ code: 'DUPLICATE_NAME', status: 409 });

    // Soft-deleting then recreating with same name avoids deleted ID (C31)
    await softDeleteAdminProduct(created.id, db);
    const recreated = await createAdminProduct(
      {
        category: 'cpu',
        name: 'Custom Test CPU',
        priceVnd: 7_600_000,
        image: { kind: 'none' },
        vendor: 'amd',
        architecture: 'Zen 5',
        socket: 'AM5',
        processNode: 'TSMC 4nm',
        coresTotal: 8,
        threadsTotal: 16,
        pCores: null,
        eCores: null,
        baseClockGhz: 4.0,
        boostClockGhz: 5.0,
        cacheText: 'L3 32 MB',
        l3CacheMb: 32,
        tdpW: 65,
        psuPowerW: 90,
        ramSupport: 'DDR5-5600',
        passmarkRaw: 35000,
        passmarkSource: 'PassMark',
      },
      db,
    );
    expect(recreated.id).toBe('cpu-custom-test-cpu-2');

    // Retail CPU cannot reuse legacy CPU name (C21 reverse)
    await expect(
      createAdminProduct(
        {
          category: 'cpu',
          name: 'Intel Core i9-11900K',
          priceVnd: 5_000_000,
          image: { kind: 'none' },
          vendor: 'intel',
          architecture: 'Rocket Lake',
          socket: 'LGA1200',
          processNode: '14nm',
          coresTotal: 8,
          threadsTotal: 16,
          pCores: null,
          eCores: null,
          baseClockGhz: 3.5,
          boostClockGhz: 5.3,
          cacheText: 'L3 16 MB',
          l3CacheMb: 16,
          tdpW: 125,
          psuPowerW: 250,
          ramSupport: 'DDR4-3200',
          passmarkRaw: 25000,
          passmarkSource: 'PassMark',
        },
        db,
      ),
    ).rejects.toMatchObject({ code: 'DUPLICATE_NAME', status: 409 });

    const legacyList = await listAdminLegacyCpus(db);
    expect(legacyList).toHaveLength(24);
  });

  it('enforces GPU series rules: SERIES_NOT_RETAIL, HAS_VARIANTS, DB kind immutability, and image cleanup', async () => {
    // Rejects AIB variant targeting legacy GPU series (C19)
    await expect(
      createAdminProduct(
        {
          category: 'gpu',
          seriesId: 'G01',
          name: 'Fake Legacy Variant',
          aibBrand: 'ASUS',
          priceVnd: 10_000_000,
          image: { kind: 'none' },
          lengthMm: 300,
          slotThickness: 2.5,
          hdmiCount: 1,
          dpCount: 3,
        },
        db,
      ),
    ).rejects.toMatchObject({ code: 'SERIES_NOT_RETAIL', status: 409 });

    // Blocks deleting base series with active variants (C18)
    await expect(softDeleteAdminGpuSeries('gs-rtx-5090', db)).rejects.toMatchObject({
      code: 'HAS_VARIANTS',
      status: 409,
    });

    // Soft-deleted variants do not block series deletion
    const newSeries = await createAdminGpuSeries(
      {
        kind: 'retail',
        name: 'NVIDIA RTX Test 9999',
        vendor: 'nvidia',
        vramGb: 24,
        tbpW: 350,
        cores: 10000,
        baseClockMhz: 2100,
        boostClockMhz: 2500,
        memoryType: 'GDDR7',
        busWidthBit: 256,
        passmarkRaw: 30000,
        passmarkSource: 'PassMark',
      },
      db,
    );

    const fakeUuid = '11111111-1111-4111-8111-111111111111';
    const deleteSpy = vi.fn(async () => {});
    process.env.SUPABASE_URL = TEST_STORAGE_CONFIG.supabaseUrl;
    process.env.SUPABASE_STORAGE_BUCKET = TEST_STORAGE_CONFIG.bucket;

    const variant = await createAdminProduct(
      {
        category: 'gpu',
        seriesId: newSeries.id,
        name: 'Asus Test 9999 OC',
        aibBrand: 'asus',
        priceVnd: 30_000_000,
        image: { kind: 'upload', storagePath: `uploads/${fakeUuid}.webp` },
        lengthMm: 310,
        slotThickness: 2.5,
        hdmiCount: 1,
        dpCount: 3,
      },
      db,
    );
    expect(variant.category === 'gpu' && variant.aibBrand).toBe('ASUS');

    await updateAdminProduct(
      variant.id,
      { image: { kind: 'url', url: 'https://example.com/gpu.webp' } },
      db,
      deleteSpy,
    );
    expect(deleteSpy).toHaveBeenCalledWith(`uploads/${fakeUuid}.webp`);

    await expect(softDeleteAdminGpuSeries(newSeries.id, db)).rejects.toMatchObject({
      code: 'HAS_VARIANTS',
    });
    await softDeleteAdminProduct(variant.id, db);
    await expect(softDeleteAdminGpuSeries(newSeries.id, db)).resolves.toBeUndefined();

    // DB trigger forbids mutating gpu_series.kind (C20)
    let triggerErr: unknown;
    try {
      await db.update(gpuSeries).set({ kind: 'retail' }).where(eq(gpuSeries.id, 'G01'));
    } catch (err) {
      triggerErr = err;
    }
    expect(triggerErr).toBeDefined();
    expect((triggerErr as { cause?: { message?: string; code?: string } }).cause).toMatchObject({
      code: '23514',
      message: 'gpu_series.kind is immutable',
    });

    const seriesList = await listAdminGpuSeries('retail', db);
    expect(seriesList.length).toBe(13);
    expect((await listAdminProducts('cpu', db)).length).toBe(35);
  });

  it('lists full-phone orders for admin and resets DB + auth_failures + uploads cleanly', async () => {
    const key = randomUUID();
    const created = await createOrder(
      {
        idempotencyKey: key,
        items: [{ productId: 'cpu-amd-ryzen-7-9800x3d', quantity: 1 }],
        customer: {
          fullName: 'Trần Thị Bình',
          phone: '0987654321',
          provinceCode: '01',
          wardCode: '00004',
          streetAddress: '45 Lý Thường Kiệt, Hà Nội',
        },
        paymentMethod: 'cod',
      },
      key,
      db,
    );

    const adminOrders = await listAdminOrders(db);
    expect(adminOrders).toHaveLength(1);
    expect(adminOrders[0].phone).toBe('0987654321');

    const adminDetail = await getAdminOrderDetail(created.order.orderId, db);
    expect(adminDetail.customer.phoneMasked).toBe('0987654321');

    await db.insert(authFailures).values({
      scope: 'admin_login',
      ipHash: 'deadbeef',
    });

    const resetResult = await resetSampleData(
      db,
      async () => ({ imagesPurged: 2, warnings: [] }),
      TEST_STORAGE_CONFIG,
    );

    expect(resetResult).toEqual({
      ordersDeleted: 1,
      productsRestored: 106,
      imagesPurged: 2,
      warnings: [],
    });
    expect(await listAdminOrders(db)).toEqual([]);
    expect(await db.select().from(authFailures)).toEqual([]);
  });

  it('supports optional PassMark scores on legacy CPUs and legacy GPU series while requiring them on retail GPU series', async () => {
    const legacyCpu = await createAdminLegacyCpu(
      {
        name: 'Intel Legacy Bench CPU',
        vendor: 'intel',
        socket: 'LGA1200',
        coresTotal: 8,
        threadsTotal: 16,
        psuPowerW: 190,
        passmarkRaw: 22_500,
        passmarkSource: null,
      },
      db,
    );
    expect(legacyCpu.passmarkRaw).toBe(22_500);
    expect(legacyCpu.passmarkSource).toBe('PassMark');

    const clearedCpu = await updateAdminLegacyCpu(
      legacyCpu.id,
      { passmarkRaw: null, passmarkSource: null },
      db,
    );
    expect(clearedCpu.passmarkRaw).toBeNull();
    expect(clearedCpu.passmarkSource).toBeNull();

    const legacyGpu = await createAdminGpuSeries(
      {
        kind: 'legacy',
        name: 'NVIDIA Legacy Bench GPU',
        vendor: 'nvidia',
        vramGb: 10,
        tbpW: 320,
        passmarkRaw: 24_800,
        passmarkSource: 'PassMark G3D',
      },
      db,
    );
    expect(legacyGpu.passmarkRaw).toBe(24_800);
    expect(legacyGpu.passmarkSource).toBe('PassMark G3D');

    const updatedLegacyGpu = await updateAdminGpuSeries(
      legacyGpu.id,
      { passmarkRaw: 25_100 },
      db,
    );
    expect(updatedLegacyGpu.passmarkRaw).toBe(25_100);
    expect(updatedLegacyGpu.passmarkSource).toBe('PassMark G3D');

    const clearedLegacyGpu = await updateAdminGpuSeries(
      legacyGpu.id,
      { passmarkRaw: null },
      db,
    );
    expect(clearedLegacyGpu.passmarkRaw).toBeNull();
    expect(clearedLegacyGpu.passmarkSource).toBeNull();

    await expect(
      updateAdminGpuSeries('gs-rtx-5090', { passmarkRaw: null }, db),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
  });
});
