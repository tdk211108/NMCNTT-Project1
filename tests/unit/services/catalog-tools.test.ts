import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import type { DbClient } from '@/server/db/client';
import { products } from '@/server/db/schema';
import {
  getLandingShowcaseProducts,
  getProductDetail,
  listProducts,
} from '@/server/services/catalog.service';
import { listLocalMusicTracks, parseMusicTrackFilename } from '@/server/services/music.service';
import { compareProducts } from '@/server/services/compare.service';
import { getPerfPerPriceRanking } from '@/server/services/perf-per-price.service';
import { estimatePsu, getPsuOptions } from '@/server/services/psu.service';
import { getComboRecommendations } from '@/server/services/combo-advisor.service';
import {
  getUpgradeOptions,
  getUpgradeRecommendations,
} from '@/server/services/upgrade-advisor.service';
import { suggestProducts } from '@/server/services/search.service';
import {
  createAdminGpuSeries,
  updateAdminGpuSeries,
} from '@/server/services/admin-gpu-series.service';
import { updateAdminLegacyCpu } from '@/server/services/admin-legacy-cpus.service';
import { setupTestDbLifecycle } from '../../helpers/test-db';

let db: DbClient;

setupTestDbLifecycle({
  onBeforeAll: (client) => {
    db = client;
  },
});

describe('services/catalog, search, compare, perf-per-price, psu (Postgres 16)', () => {
  it('lists retail products with category-wide facets, dynamic normalized scores, server pagination, and filtering', async () => {
    const allCpus = await listProducts({ category: 'cpu' }, db);
    expect(allCpus.total).toBe(88);
    expect(allCpus.facets.vendors).toEqual(['amd', 'intel']);
    expect(allCpus.facets.sockets).toEqual(['AM4', 'AM5', 'LGA1700', 'LGA1851']);
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
    expect(filtered.items).toHaveLength(2);
    expect(filtered.items[0].id).toBe('cpu-amd-ryzen-9-9950x3d2');
    expect(filtered.items[0].score.normalized).toBe(100);
    expect(filtered.items[1].id).toBe('cpu-amd-ryzen-9-9950x3d');
    expect(filtered.facets.vendors).toEqual(['amd', 'intel']);

    // Server-side per-vendor pagination loads only requested pages per brand
    const cpuPaged = await listProducts(
      {
        category: 'cpu',
        perVendor: true,
        pageSize: 16,
        vendorPages: { amd: 2, intel: 3 },
      },
      db,
    );
    expect(cpuPaged.total).toBe(88);
    expect(cpuPaged.vendorTotals).toEqual({ amd: 39, intel: 49 });
    expect(cpuPaged.items.filter((i) => i.vendor === 'amd')).toHaveLength(16);
    expect(cpuPaged.items.filter((i) => i.vendor === 'intel')).toHaveLength(16);

    // Escapes SQL ILIKE wildcards (`%`, `_`) so they do not match everything
    const wildcard = await listProducts({ category: 'cpu', q: '100%_' }, db);
    expect(wildcard.total).toBe(0);

    // Zero active products in category returns empty list and null priceRange (C22)
    await db.update(products).set({ deletedAt: new Date() }).where(eq(products.category, 'cpu'));
    const emptyCategory = await listProducts({ category: 'cpu' }, db);
    expect(emptyCategory.items).toEqual([]);
    expect(emptyCategory.facets.priceRange).toBeNull();

    // GPU listing supports filtering Limited Edition, Intel Arc, server pagination, and exact seriesId
    const allGpus = await listProducts({ category: 'gpu' }, db);
    expect(allGpus.total).toBe(232);
    const gpuPage1 = await listProducts({ category: 'gpu', page: 1, pageSize: 40 }, db);
    const gpuPage6 = await listProducts({ category: 'gpu', page: 6, pageSize: 40 }, db);
    expect(gpuPage1.items).toHaveLength(40);
    expect(gpuPage1.total).toBe(232);
    expect(gpuPage1.pagination).toEqual({ page: 1, pageSize: 40, totalPages: 6 });
    expect(gpuPage6.items).toHaveLength(32);
    const page1Ids = new Set(gpuPage1.items.map((g) => g.id));
    expect(gpuPage6.items.every((g) => !page1Ids.has(g.id))).toBe(true);

    const intelGpus = await listProducts({ category: 'gpu', vendor: ['intel'] }, db);
    expect(intelGpus.total).toBe(9);
    expect(intelGpus.items.every((g) => g.vendor === 'intel')).toBe(true);

    const series5060 = await listProducts({ category: 'gpu', seriesId: 'gs-rtx-5060' }, db);
    expect(series5060.total).toBeGreaterThan(0);
    expect(series5060.items.every((g) => !g.name.toLowerCase().includes('5060 ti'))).toBe(true);
    const limitedGpus = await listProducts({ category: 'gpu', limitedEdition: true }, db);
    expect(limitedGpus.total).toBe(45);
    expect(limitedGpus.items.every((g) => g.isLimitedEdition)).toBe(true);
  });

  it('loads product detail with stockStatus=in_stock and hides soft-deleted items', async () => {
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

    const intelDetail = await getProductDetail('gpu-intel-arc-b580-limited-edition-12gb', db);
    expect(intelDetail.vendor).toBe('intel');
    expect(intelDetail.isLimitedEdition).toBe(true);
    expect(intelDetail.specGroups[0].items.find((i) => i.key === 'cores')?.label).toBe('Shading Units');

    await db
      .update(products)
      .set({ deletedAt: new Date() })
      .where(eq(products.id, 'cpu-intel-core-i3-12100f'));

    await expect(getProductDetail('cpu-intel-core-i3-12100f', db)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
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
    expect(valid.products.every((p) => typeof p.imageUrl === 'string' && p.imageUrl.length > 0)).toBe(true);
    expect(valid.rows).toHaveLength(11);
    expect(valid.notes).toHaveLength(2);

    const validThreeGpus = await compareProducts(
      'gpu-asus-rog-astral-rtx-5090-32gb-oc,gpu-msi-rtx-5090-32gb-lightning-z,gpu-asus-rog-matrix-30th-rtx-5090-32gb',
      db,
    );
    expect(validThreeGpus.category).toBe('gpu');
    expect(validThreeGpus.products).toHaveLength(3);
    expect(validThreeGpus.products.every((p) => typeof p.imageUrl === 'string' && p.imageUrl.length > 0)).toBe(true);

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

  it('ranks active products by performance-per-price, builds 8 CPU and 9 GPU grouped hardware awards, and handles low-budget empty state', async () => {
    const ranking = await getPerfPerPriceRanking(
      { category: 'cpu', vendor: ['amd'], maxPriceVnd: 15_000_000 },
      db,
    );
    expect(ranking.items.length).toBeGreaterThan(0);
    expect(ranking.items[0].bestValue).toBe(true);
    expect(ranking.items.every((i) => i.vendor === 'amd' && i.priceVnd <= 15_000_000)).toBe(true);
    expect(ranking.totalEvaluated).toBe(ranking.items.length);
    expect(ranking.awards.length).toBeGreaterThan(0);
    expect(ranking.awards.reduce((sum, w) => sum + w.awardCount, 0)).toBe(8);
    expect(new Set(ranking.awards.map((w) => w.id)).size).toBe(ranking.awards.length);

    const gpuAwards = await getPerfPerPriceRanking({ category: 'gpu' }, db);
    expect(gpuAwards.totalEvaluated).toBe(232);
    expect(gpuAwards.awards.reduce((sum, w) => sum + w.awardCount, 0)).toBe(9);
    expect(gpuAwards.awards[0].awardCount).toBeGreaterThanOrEqual(
      gpuAwards.awards[gpuAwards.awards.length - 1].awardCount,
    );
    const largestGpuWinner = gpuAwards.awards.find((w) =>
      w.awards.some((a) => a.key === 'largest_gpu'),
    );
    expect(largestGpuWinner?.id).toBe('gpu-asus-rtx-5080-noctua-oc-16gb');
    expect(largestGpuWinner?.awards.find((a) => a.key === 'largest_gpu')?.metricDisplay).toBe(
      '385 mm (4,0 slot)',
    );

    const emptyBudget = await getPerfPerPriceRanking(
      { category: 'gpu', maxPriceVnd: 100_000 },
      db,
    );
    expect(emptyBudget.items).toEqual([]);
    expect(emptyBudget.awards).toEqual([]);
    expect(emptyBudget.totalEvaluated).toBe(0);
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

  it('returns curated 5 CPU + 5 GPU showcase models for landing page', async () => {
    const landing = await getLandingShowcaseProducts(db);
    expect(landing.cpus.map((c) => c.id)).toEqual([
      'cpu-intel-core-i5-14600k',
      'cpu-amd-ryzen-7-9800x3d',
      'cpu-intel-core-ultra-7-270k-plus',
      'cpu-amd-ryzen-5-7500f',
      'cpu-intel-core-ultra-9-285k',
    ]);
    expect(landing.gpus.map((g) => g.id)).toEqual([
      'gpu-asus-t1-rtx-5060-ti-8gb-oc',
      'gpu-asus-rog-astral-rtx-5090-dhahab-oc',
      'gpu-asus-rog-matrix-30th-rtx-5090-32gb',
      'gpu-asus-rog-astral-rtx-5080-16gb-hatsune-miku-oc',
      'gpu-msi-rtx-5090-32gb-lightning-z',
    ]);
  });

  it('scans local music folder dynamically and ignores non-audio files', async () => {
    const parsedWithArtist = parseMusicTrackFilename('HOYO-MiX - Endless_Tower.mp3');
    expect(parsedWithArtist).toMatchObject({
      artist: 'HOYO-MiX',
      title: 'Endless Tower',
      src: '/music/HOYO-MiX%20-%20Endless_Tower.mp3',
    });

    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'cr-music-'));
    try {
      await writeFile(path.join(tmpDir, 'README.txt'), 'ignore');
      await writeFile(path.join(tmpDir, '02 - Track B.mp3'), 'dummy');
      await writeFile(path.join(tmpDir, '01_Track_A.wav'), 'dummy');
      const tracks = await listLocalMusicTracks(tmpDir);
      expect(tracks.map((t) => t.fileName)).toEqual(['01_Track_A.wav', '02 - Track B.mp3']);
    } finally {
      await rm(tmpDir, { recursive: true, force: true });
    }
  });

  it('computes distinct smart combos, handles under-budget threshold, and respects vendor filters', async () => {
    const comboResult = await getComboRecommendations(
      { budgetVnd: 20_000_000, purpose: 'gaming_aaa' },
      db,
    );
    expect(comboResult.combos.length).toBeGreaterThanOrEqual(2);
    expect(comboResult.combos.length).toBeLessThanOrEqual(3);
    const gpuSeriesSet = new Set(comboResult.combos.map((c) => c.gpu.seriesId));
    expect(gpuSeriesSet.size).toBe(comboResult.combos.length);
    expect(comboResult.notes.length).toBe(3);

    const vendorFiltered = await getComboRecommendations(
      {
        budgetVnd: 25_000_000,
        purpose: 'work_ai',
        cpuVendor: 'amd',
        gpuVendor: 'nvidia',
      },
      db,
    );
    expect(vendorFiltered.combos.length).toBeGreaterThan(0);
    expect(
      vendorFiltered.combos.every((c) => c.cpu.vendor === 'amd' && c.gpu.vendor === 'nvidia'),
    ).toBe(true);

    const tooLow = await getComboRecommendations(
      { budgetVnd: 5_000_000, purpose: 'esport' },
      db,
    );
    expect(tooLow.combos).toEqual([]);
    expect(tooLow.minAvailableComboPriceVnd).toBeGreaterThan(5_000_000);
    expect(tooLow.cheapestReferenceCombo).not.toBeNull();
  });

  it('lists upgrade options and computes CPU/GPU upgrades for both store and legacy hardware', async () => {
    const options = await getUpgradeOptions(undefined, db);
    expect(options.cpus.some((c) => c.id === 'store:cpu-intel-core-i5-12400f' && c.hasPassmark)).toBe(true);
    expect(options.cpus.some((c) => c.id === 'legacy:C22')).toBe(true);
    expect(options.gpus.some((g) => g.id === 'gs-rtx-5060')).toBe(true);
    expect(options.gpus.some((g) => g.id === 'G29')).toBe(true);

    // Store CPU LGA1700 -> same-socket + platform-swap separation
    const storeCpuUpgrade = await getUpgradeRecommendations(
      { category: 'cpu', current: 'store:cpu-intel-core-i5-12400f' },
      db,
    );
    expect(storeCpuUpgrade.hasSameSocketInCatalog).toBe(true);
    expect(storeCpuUpgrade.sameSocketCpus.length).toBeGreaterThan(0);
    expect(storeCpuUpgrade.sameSocketCpus.length).toBeLessThanOrEqual(3);
    expect(storeCpuUpgrade.sameSocketCpus.every((c) => c.sameSocket)).toBe(true);
    expect(storeCpuUpgrade.platformSwapCpus.length).toBeLessThanOrEqual(3);
    expect(storeCpuUpgrade.platformSwapCpus.every((c) => !c.sameSocket)).toBe(true);

    // Legacy CPU without PassMark degrades cleanly -> notes include missingPassmarkNote & upliftPct null
    await updateAdminLegacyCpu('C22', { passmarkRaw: null, passmarkSource: null }, db);
    const legacyNoScore = await getUpgradeRecommendations(
      { category: 'cpu', current: 'legacy:C22' },
      db,
    );
    expect(legacyNoScore.current.hasPassmark).toBe(false);
    expect(legacyNoScore.platformSwapCpus.length).toBeGreaterThan(0);
    expect(legacyNoScore.platformSwapCpus.length).toBeLessThanOrEqual(3);
    expect(legacyNoScore.platformSwapCpus.every((c) => c.upliftPct === null)).toBe(true);
    expect(legacyNoScore.notes[0]).toContain('PassMark');

    // Populate legacy CPU & legacy GPU PassMark via admin service and verify real +10% uplift & warnings
    await updateAdminLegacyCpu('C22', { passmarkRaw: 21500, passmarkSource: 'PassMark' }, db);
    const legacyWithScore = await getUpgradeRecommendations(
      { category: 'cpu', current: 'legacy:C22', sort: 'uplift_desc' },
      db,
    );
    expect(legacyWithScore.current.hasPassmark).toBe(true);
    expect(legacyWithScore.platformSwapCpus.length).toBeLessThanOrEqual(3);
    expect(legacyWithScore.platformSwapCpus.every((c) => (c.upliftPct ?? 0) >= 10)).toBe(true);

    await updateAdminGpuSeries('G29', { passmarkRaw: 17000, passmarkSource: 'PassMark' }, db);
    const legacyGpuUpgrade = await getUpgradeRecommendations(
      { category: 'gpu', current: 'G29', sort: 'price_asc' },
      db,
    );
    expect(legacyGpuUpgrade.current.vramGb).toBe(12);
    expect(legacyGpuUpgrade.gpus.length).toBe(3);
    const rtx5060 = legacyGpuUpgrade.gpus.find((g) => g.seriesId === 'gs-rtx-5060');
    expect(rtx5060?.warnings.some((w) => w.code === 'gpu_vram_decrease')).toBe(true);

    // Unknown or invalid current throws NOT_FOUND 404
    await expect(
      getUpgradeRecommendations({ category: 'cpu', current: 'legacy:C9999' }, db),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    await expect(
      getUpgradeRecommendations({ category: 'gpu', current: 'gs-missing' }, db),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });
});
