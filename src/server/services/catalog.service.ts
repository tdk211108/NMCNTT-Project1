import 'server-only';

import { and, asc, desc, eq, gte, inArray, isNull, lte, sql, type SQL } from 'drizzle-orm';
import {
  CATALOG_MAX_RESULTS,
  FEATURED_PER_CATEGORY,
  LANDING_FEATURED_CPU_IDS,
  LANDING_FEATURED_GPU_IDS,
  PACKAGING_DEFAULT,
  WARRANTY_MONTHS,
} from '@/shared/constants';
import type {
  ChipVendor,
  CpuVendor,
  Facets,
  FeaturedProductsResponse,
  GpuVendor,
  ProductCard,
  ProductDetail,
  ProductListQuery,
  ProductListResponse,
  RemovedItem,
  ResolveResponse,
  SpecGroup,
  SpecItem,
} from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, products } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { pickFeaturedCandidates } from '../domain/featured';
import { AppError } from '../http/errors';

export function escapeIlikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function formatViNumber(value: number, fractionDigits?: number): string {
  return value.toLocaleString(
    'vi-VN',
    fractionDigits === undefined
      ? undefined
      : { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits },
  );
}

function buildCpuSummary(row: {
  coresTotal: number;
  threadsTotal: number;
  boostClockGhz: number;
  socket: string;
  tdpW: number;
}): SpecItem[] {
  return [
    {
      key: 'coresThreads',
      label: 'Nhân / Luồng',
      value: `${row.coresTotal} nhân / ${row.threadsTotal} luồng`,
    },
    {
      key: 'boostClock',
      label: 'Xung Boost',
      value: `${formatViNumber(row.boostClockGhz, 2)} GHz`,
    },
    {
      key: 'socket',
      label: 'Socket',
      value: row.socket,
    },
    {
      key: 'tdp',
      label: 'TDP',
      value: `${formatViNumber(row.tdpW)} W`,
    },
  ];
}

function buildGpuSummary(row: {
  vramGb: number;
  memoryType: string;
  boostClockMhz: number;
  tbpW: number;
}): SpecItem[] {
  return [
    { key: 'vram', label: 'VRAM', value: `${formatViNumber(row.vramGb)} GB` },
    { key: 'memoryType', label: 'Loại bộ nhớ', value: row.memoryType },
    {
      key: 'boostClock',
      label: 'Xung Boost',
      value: `${formatViNumber(row.boostClockMhz)} MHz`,
    },
    { key: 'tbp', label: 'TBP', value: `${formatViNumber(row.tbpW)} W` },
  ];
}

const viCollator = new Intl.Collator('vi');

async function computeCategoryFacets(
  category: 'cpu' | 'gpu',
  db: DbClient,
): Promise<Facets> {
  const rows = await db
    .select({
      vendor: storefrontProductsV.vendor,
      priceVnd: storefrontProductsV.priceVnd,
      socket: storefrontProductsV.socket,
      vramGb: storefrontProductsV.vramGb,
      aibBrand: storefrontProductsV.aibBrand,
    })
    .from(storefrontProductsV)
    .where(eq(storefrontProductsV.category, category));

  if (rows.length === 0) {
    return {
      vendors: [],
      priceRange: null,
      ...(category === 'cpu' ? { sockets: [] } : { vramGb: [], aibBrands: [] }),
    };
  }

  const vendorsSet = new Set<ChipVendor>();
  const socketsSet = new Set<string>();
  const vramSet = new Set<number>();
  const aibSet = new Set<string>();

  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  for (const row of rows) {
    vendorsSet.add(row.vendor as ChipVendor);
    if (row.priceVnd < minPrice) minPrice = row.priceVnd;
    if (row.priceVnd > maxPrice) maxPrice = row.priceVnd;
    if (row.socket) socketsSet.add(row.socket);
    if (row.vramGb !== null) vramSet.add(row.vramGb);
    if (row.aibBrand) aibSet.add(row.aibBrand);
  }

  const vendors = [...vendorsSet].sort((a, b) => a.localeCompare(b));

  if (category === 'cpu') {
    return {
      vendors,
      priceRange: { min: minPrice, max: maxPrice },
      sockets: [...socketsSet].sort((a, b) => viCollator.compare(a, b)),
    };
  }

  return {
    vendors,
    priceRange: { min: minPrice, max: maxPrice },
    vramGb: [...vramSet].sort((a, b) => a - b),
    aibBrands: [...aibSet].sort((a, b) => viCollator.compare(a, b)),
  };
}

function buildSortOrder(sort: ProductListQuery['sort']) {
  switch (sort) {
    case 'price_asc':
      return [asc(storefrontProductsV.priceVnd), asc(storefrontProductsV.id)];
    case 'price_desc':
      return [desc(storefrontProductsV.priceVnd), asc(storefrontProductsV.id)];
    case 'score_desc':
      return [
        desc(storefrontProductsV.normalizedScore),
        asc(storefrontProductsV.priceVnd),
        asc(storefrontProductsV.id),
      ];
    case 'default':
    default:
      return [
        asc(storefrontProductsV.vendor),
        desc(storefrontProductsV.normalizedScore),
        asc(storefrontProductsV.priceVnd),
        asc(storefrontProductsV.id),
      ];
  }
}

async function queryCpuCardRows(
  whereClause: SQL | undefined,
  orderBy: ReturnType<typeof buildSortOrder>,
  limit: number,
  db: DbClient,
): Promise<Array<{ card: ProductCard; seriesId: null }>> {
  const rows = await db
    .select({
      id: storefrontProductsV.id,
      category: storefrontProductsV.category,
      name: storefrontProductsV.name,
      priceVnd: storefrontProductsV.priceVnd,
      imageUrl: storefrontProductsV.imageUrl,
      vendor: storefrontProductsV.vendor,
      passmarkRaw: storefrontProductsV.passmarkRaw,
      normalizedScore: storefrontProductsV.normalizedScore,
      coresTotal: cpuSpecs.coresTotal,
      threadsTotal: cpuSpecs.threadsTotal,
      boostClockGhz: cpuSpecs.boostClockGhz,
      socket: cpuSpecs.socket,
      tdpW: cpuSpecs.tdpW,
    })
    .from(storefrontProductsV)
    .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit);

  return rows.map((row) => ({
    seriesId: null,
    card: {
      id: row.id,
      category: 'cpu' as const,
      name: row.name,
      priceVnd: row.priceVnd,
      imageUrl: row.imageUrl,
      vendor: row.vendor as CpuVendor,
      aibBrand: null,
      isLimitedEdition: false,
      score: {
        raw: row.passmarkRaw,
        normalized: row.normalizedScore,
      },
      summary: buildCpuSummary(row),
    },
  }));
}

async function queryGpuCardRows(
  whereClause: SQL | undefined,
  orderBy: ReturnType<typeof buildSortOrder>,
  limit: number,
  db: DbClient,
): Promise<Array<{ card: ProductCard; seriesId: string | null }>> {
  const rows = await db
    .select({
      id: storefrontProductsV.id,
      category: storefrontProductsV.category,
      name: storefrontProductsV.name,
      priceVnd: storefrontProductsV.priceVnd,
      imageUrl: storefrontProductsV.imageUrl,
      vendor: storefrontProductsV.vendor,
      aibBrand: storefrontProductsV.aibBrand,
      seriesId: storefrontProductsV.seriesId,
      isLimitedEdition: storefrontProductsV.isLimitedEdition,
      passmarkRaw: storefrontProductsV.passmarkRaw,
      normalizedScore: storefrontProductsV.normalizedScore,
      vramGb: gpuSeries.vramGb,
      memoryType: gpuSeries.memoryType,
      boostClockMhz: gpuSeries.boostClockMhz,
      tbpW: gpuSeries.tbpW,
    })
    .from(storefrontProductsV)
    .innerJoin(gpuSeries, eq(gpuSeries.id, storefrontProductsV.seriesId))
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(limit);

  return rows.map((row) => ({
    seriesId: row.seriesId,
    card: {
      id: row.id,
      category: 'gpu' as const,
      name: row.name,
      priceVnd: row.priceVnd,
      imageUrl: row.imageUrl,
      vendor: row.vendor as GpuVendor,
      aibBrand: row.aibBrand,
      isLimitedEdition: row.isLimitedEdition,
      score: {
        raw: row.passmarkRaw,
        normalized: row.normalizedScore,
      },
      summary: buildGpuSummary({
        vramGb: row.vramGb,
        memoryType: row.memoryType ?? '',
        boostClockMhz: row.boostClockMhz ?? 0,
        tbpW: row.tbpW,
      }),
    },
  }));
}

export async function listProducts(
  query: ProductListQuery,
  db: DbClient = getDb(),
): Promise<ProductListResponse> {
  const facets = await computeCategoryFacets(query.category, db);

  const conditions = [eq(storefrontProductsV.category, query.category)];
  if (query.vendor?.length) {
    conditions.push(inArray(storefrontProductsV.vendor, query.vendor));
  }
  if (query.priceMin !== undefined) {
    conditions.push(gte(storefrontProductsV.priceVnd, query.priceMin));
  }
  if (query.priceMax !== undefined) {
    conditions.push(lte(storefrontProductsV.priceVnd, query.priceMax));
  }
  if (query.vramGb?.length) {
    conditions.push(inArray(storefrontProductsV.vramGb, query.vramGb));
  }
  if (query.aibBrand?.length) {
    conditions.push(inArray(storefrontProductsV.aibBrand, query.aibBrand));
  }
  if (query.socket?.length) {
    conditions.push(inArray(storefrontProductsV.socket, query.socket));
  }
  if (query.limitedEdition === true) {
    conditions.push(eq(storefrontProductsV.isLimitedEdition, true));
  }
  if (query.q && query.q.trim().length > 0) {
    const pattern = `%${escapeIlikePattern(query.q.trim().toLowerCase())}%`;
    conditions.push(sql`${storefrontProductsV.searchText} ILIKE ${pattern}`);
  }

  const orderBy = buildSortOrder(query.sort);
  const whereClause = and(...conditions);

  const rows =
    query.category === 'cpu'
      ? await queryCpuCardRows(whereClause, orderBy, CATALOG_MAX_RESULTS, db)
      : await queryGpuCardRows(whereClause, orderBy, CATALOG_MAX_RESULTS, db);

  const items = rows.map((row) => row.card);

  return {
    items,
    facets,
    total: items.length,
  };
}

export async function getFeaturedProducts(
  limit = FEATURED_PER_CATEGORY,
  db: DbClient = getDb(),
): Promise<FeaturedProductsResponse> {
  const orderBy = buildSortOrder('score_desc');
  const [cpuRows, gpuRows] = await Promise.all([
    queryCpuCardRows(eq(storefrontProductsV.category, 'cpu'), orderBy, CATALOG_MAX_RESULTS, db),
    queryGpuCardRows(eq(storefrontProductsV.category, 'gpu'), orderBy, CATALOG_MAX_RESULTS, db),
  ]);

  const toCandidate = (row: { card: ProductCard; seriesId: string | null }) => ({
    id: row.card.id,
    vendor: row.card.vendor,
    seriesId: row.seriesId,
    normalizedScore: row.card.score.normalized ?? 0,
    priceVnd: row.card.priceVnd,
    card: row.card,
  });

  return {
    cpus: pickFeaturedCandidates(cpuRows.map(toCandidate), limit).map((item) => item.card),
    gpus: pickFeaturedCandidates(gpuRows.map(toCandidate), limit).map((item) => item.card),
  };
}

function orderCardsByIds(rows: Array<{ card: ProductCard }>, orderedIds: readonly string[]): ProductCard[] {
  const byId = new Map(rows.map((row) => [row.card.id, row.card]));
  return orderedIds.map((id) => byId.get(id)).filter((card): card is ProductCard => Boolean(card));
}

export async function getLandingShowcaseProducts(
  db: DbClient = getDb(),
): Promise<FeaturedProductsResponse> {
  const orderBy = buildSortOrder('default');
  const [cpuRows, gpuRows] = await Promise.all([
    queryCpuCardRows(
      and(
        eq(storefrontProductsV.category, 'cpu'),
        inArray(storefrontProductsV.id, [...LANDING_FEATURED_CPU_IDS]),
      ),
      orderBy,
      LANDING_FEATURED_CPU_IDS.length,
      db,
    ),
    queryGpuCardRows(
      and(
        eq(storefrontProductsV.category, 'gpu'),
        inArray(storefrontProductsV.id, [...LANDING_FEATURED_GPU_IDS]),
      ),
      orderBy,
      LANDING_FEATURED_GPU_IDS.length,
      db,
    ),
  ]);

  return {
    cpus: orderCardsByIds(cpuRows, LANDING_FEATURED_CPU_IDS),
    gpus: orderCardsByIds(gpuRows, LANDING_FEATURED_GPU_IDS),
  };
}

export async function getProductDetail(
  id: string,
  db: DbClient = getDb(),
): Promise<ProductDetail> {
  const [viewRow] = await db
    .select()
    .from(storefrontProductsV)
    .where(eq(storefrontProductsV.id, id))
    .limit(1);

  if (!viewRow) {
    throw new AppError('NOT_FOUND');
  }

  if (viewRow.category === 'cpu') {
    const [cpu] = await db
      .select()
      .from(cpuSpecs)
      .where(eq(cpuSpecs.productId, id))
      .limit(1);

    if (!cpu) {
      throw new AppError('NOT_FOUND');
    }

    const coresValue =
      cpu.pCores !== null && cpu.eCores !== null
        ? `${cpu.coresTotal} nhân / ${cpu.threadsTotal} luồng (${cpu.pCores} P-Core, ${cpu.eCores} E-Core)`
        : `${cpu.coresTotal} nhân / ${cpu.threadsTotal} luồng`;

    const specGroups: SpecGroup[] = [
      {
        key: 'specs',
        title: 'Thông số kỹ thuật',
        items: [
          { key: 'architecture', label: 'Kiến trúc', value: cpu.architecture },
          { key: 'socket', label: 'Socket', value: cpu.socket },
          { key: 'processNode', label: 'Tiến trình', value: cpu.processNode },
          { key: 'coresThreads', label: 'Số nhân / luồng', value: coresValue },
          {
            key: 'baseClock',
            label: 'Xung nhịp cơ bản',
            value: `${formatViNumber(cpu.baseClockGhz, 2)} GHz`,
          },
          {
            key: 'boostClock',
            label: 'Xung nhịp boost',
            value: `${formatViNumber(cpu.boostClockGhz, 2)} GHz`,
          },
          { key: 'cache', label: 'Bộ nhớ đệm', value: cpu.cacheText },
          {
            key: 'tdp',
            label: 'Công suất tỏa nhiệt (TDP)',
            value: `${formatViNumber(cpu.tdpW)} W`,
          },
          {
            key: 'psuPower',
            label: 'Công suất tối đa tham chiếu (PSU)',
            value: `${formatViNumber(cpu.psuPowerW)} W`,
          },
          { key: 'ramSupport', label: 'Chuẩn RAM hỗ trợ', value: cpu.ramSupport },
        ],
      },
    ];

    return {
      id: viewRow.id,
      category: 'cpu',
      name: viewRow.name,
      priceVnd: viewRow.priceVnd,
      imageUrl: viewRow.imageUrl,
      vendor: cpu.vendor,
      aibBrand: null,
      isLimitedEdition: false,
      stockStatus: 'in_stock',
      warrantyMonths: WARRANTY_MONTHS,
      packaging: PACKAGING_DEFAULT,
      score: {
        raw: cpu.passmarkRaw,
        normalized: viewRow.normalizedScore,
        source: cpu.passmarkSource,
      },
      summary: buildCpuSummary(cpu),
      specGroups,
      series: null,
      psuPrefill: { cpu: `store:${viewRow.id}` },
    };
  }

  const [gpuJoin] = await db
    .select({
      variant: gpuVariants,
      series: gpuSeries,
    })
    .from(gpuVariants)
    .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
    .where(and(eq(gpuVariants.productId, id), isNull(gpuSeries.deletedAt)))
    .limit(1);

  if (!gpuJoin) {
    throw new AppError('NOT_FOUND');
  }

  const { variant, series } = gpuJoin;
  const coresLabel = series.vendor === 'nvidia' ? 'CUDA Cores' : 'Stream Processors';

  const specGroups: SpecGroup[] = [
    {
      key: 'specs',
      title: 'Thông số kỹ thuật',
      items: [
        { key: 'vram', label: 'Dung lượng VRAM', value: `${formatViNumber(series.vramGb)} GB` },
        { key: 'cores', label: coresLabel, value: formatViNumber(series.cores ?? 0) },
        { key: 'tbp', label: 'Công suất tiêu thụ (TBP)', value: `${formatViNumber(series.tbpW)} W` },
        {
          key: 'baseClock',
          label: 'Xung nhịp cơ bản',
          value: `${formatViNumber(series.baseClockMhz ?? 0)} MHz`,
        },
        {
          key: 'boostClock',
          label: 'Xung nhịp boost',
          value: `${formatViNumber(series.boostClockMhz ?? 0)} MHz`,
        },
        { key: 'memoryType', label: 'Loại bộ nhớ', value: series.memoryType ?? '' },
        {
          key: 'busWidth',
          label: 'Độ rộng bus bộ nhớ',
          value: `${formatViNumber(series.busWidthBit ?? 0)} bit`,
        },
      ],
    },
    {
      key: 'physical',
      title: 'Kích thước vật lý',
      items: [
        { key: 'lengthMm', label: 'Chiều dài card', value: `${formatViNumber(variant.lengthMm)} mm` },
        {
          key: 'slotThickness',
          label: 'Độ dày',
          value: `${formatViNumber(variant.slotThickness, 1)} slot`,
        },
      ],
    },
    {
      key: 'outputs',
      title: 'Cổng xuất hình',
      items: [
        { key: 'hdmiCount', label: 'Cổng HDMI', value: String(variant.hdmiCount) },
        { key: 'dpCount', label: 'Cổng DisplayPort', value: String(variant.dpCount) },
      ],
    },
  ];

  return {
    id: viewRow.id,
    category: 'gpu',
    name: viewRow.name,
    priceVnd: viewRow.priceVnd,
    imageUrl: viewRow.imageUrl,
    vendor: series.vendor,
    aibBrand: variant.aibBrand,
    isLimitedEdition: variant.isLimitedEdition,
    stockStatus: 'in_stock',
    warrantyMonths: WARRANTY_MONTHS,
    packaging: PACKAGING_DEFAULT,
    score: {
      raw: series.passmarkRaw ?? viewRow.passmarkRaw,
      normalized: viewRow.normalizedScore,
      source: series.passmarkSource ?? 'PassMark',
    },
    summary: buildGpuSummary({
      vramGb: series.vramGb,
      memoryType: series.memoryType ?? '',
      boostClockMhz: series.boostClockMhz ?? 0,
      tbpW: series.tbpW,
    }),
    specGroups,
    series: { id: series.id, name: series.name },
    psuPrefill: { gpu: series.id },
  };
}

export async function resolveProducts(
  ids: readonly string[],
  db: DbClient = getDb(),
): Promise<ResolveResponse> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return { active: [], removed: [] };
  }

  const [activeRows, rawProductRows] = await Promise.all([
    db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        category: storefrontProductsV.category,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
      })
      .from(storefrontProductsV)
      .where(inArray(storefrontProductsV.id, uniqueIds)),
    db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(inArray(products.id, uniqueIds)),
  ]);

  const activeById = new Map(activeRows.map((row) => [row.id, row]));
  const nameById = new Map(rawProductRows.map((row) => [row.id, row.name]));

  const active: ResolveResponse['active'] = [];
  const removed: RemovedItem[] = [];

  for (const id of uniqueIds) {
    const found = activeById.get(id);
    if (found) {
      active.push(found);
    } else {
      removed.push({
        productId: id,
        name: nameById.get(id) ?? null,
      });
    }
  }

  return { active, removed };
}
