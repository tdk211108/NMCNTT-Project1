import 'server-only';

import {
  COMPARE_MAX_ITEMS,
  COMPARE_MIN_ITEMS,
  PRODUCT_ID_MAX_LEN,
  PRODUCT_ID_REGEX,
} from '@/shared/constants';
import type {
  Category,
  ChipVendor,
  CompareInvalidReason,
  CompareRow,
  GpuVendor,
  HighlightRule,
} from '@/shared/types';
import {
  formatCpuCoresThreads,
  formatViNumber,
  resolveSingleGpuCoresLabel,
} from './format';

export interface CompareCpuInput {
  id: string;
  category: 'cpu';
  name: string;
  priceVnd: number;
  imageUrl?: string | null;
  vendor: ChipVendor;
  passmarkRaw: number;
  normalizedScore: number | null;
  architecture: string;
  socket: string;
  processNode: string;
  coresTotal: number;
  threadsTotal: number;
  pCores: number | null;
  eCores: number | null;
  baseClockGhz: number;
  boostClockGhz: number;
  cacheText: string;
  l3CacheMb: number;
  tdpW: number;
  ramSupport: string;
}

export interface CompareGpuInput {
  id: string;
  category: 'gpu';
  name: string;
  priceVnd: number;
  imageUrl?: string | null;
  vendor: ChipVendor;
  passmarkRaw: number;
  normalizedScore: number | null;
  vramGb: number;
  cores: number;
  tbpW: number;
  baseClockMhz: number;
  boostClockMhz: number;
  memoryType: string;
  busWidthBit: number;
}

export type CompareProductInput = CompareCpuInput | CompareGpuInput;

export type ParseCompareIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; reason: CompareInvalidReason; invalidIds?: string[] };

export type ValidateCompareResult =
  | { ok: true; category: Category; products: CompareProductInput[] }
  | { ok: false; reason: CompareInvalidReason; invalidIds?: string[] };

/**
 * Parses and deduplicates `?ids=` in validation order:
 * non-empty check -> max 3 items -> valid product ID format.
 */
export function parseCompareIds(rawIds: string | null | undefined): ParseCompareIdsResult {
  const deduped: string[] = [];
  const seen = new Set<string>();

  for (const part of (rawIds ?? '').split(',')) {
    const trimmed = part.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    deduped.push(trimmed);
  }

  if (deduped.length === 0) {
    return { ok: false, reason: 'NO_IDS' };
  }
  if (deduped.length > COMPARE_MAX_ITEMS) {
    return { ok: false, reason: 'TOO_MANY' };
  }

  const malformed = deduped.filter(
    (id) => id.length > PRODUCT_ID_MAX_LEN || !PRODUCT_ID_REGEX.test(id),
  );
  if (malformed.length > 0) {
    return { ok: false, reason: 'NOT_FOUND', invalidIds: malformed };
  }

  return { ok: true, ids: deduped };
}

/**
 * Validates resolved active products in order: `NOT_FOUND` -> `MIXED_CATEGORY` -> `TOO_FEW`.
 */
export function validateCompareProducts(
  orderedIds: readonly string[],
  foundProducts: readonly CompareProductInput[],
): ValidateCompareResult {
  const byId = new Map(foundProducts.map((p) => [p.id, p]));
  const missingIds = orderedIds.filter((id) => !byId.has(id));
  if (missingIds.length > 0) {
    return { ok: false, reason: 'NOT_FOUND', invalidIds: missingIds };
  }

  const ordered = orderedIds.map((id) => byId.get(id)!);
  const categories = new Set(ordered.map((p) => p.category));
  if (categories.size > 1) {
    return { ok: false, reason: 'MIXED_CATEGORY' };
  }

  if (ordered.length < COMPARE_MIN_ITEMS) {
    return { ok: false, reason: 'TOO_FEW' };
  }

  return { ok: true, category: ordered[0].category, products: ordered };
}

function buildTextRow(key: string, label: string, unit: string | null, values: string[]): CompareRow {
  return {
    key,
    label,
    unit,
    rule: 'none',
    cells: values.map((display) => ({ display, highlighted: false })),
  };
}

function buildNumericRow(
  key: string,
  label: string,
  unit: string | null,
  rule: Exclude<HighlightRule, 'none'>,
  displays: string[],
  numericValues: (number | null)[],
): CompareRow {
  const valid = numericValues.filter((v): v is number => v !== null);
  const best = valid.length > 0 ? (rule === 'higher' ? Math.max(...valid) : Math.min(...valid)) : null;
  const allEqual = best !== null && valid.length === numericValues.length && valid.every((v) => v === best);

  return {
    key,
    label,
    unit,
    rule,
    cells: displays.map((display, idx) => ({
      display,
      highlighted: !allEqual && best !== null && numericValues[idx] === best,
    })),
  };
}

function buildSharedLeadRows(products: readonly CompareProductInput[]): CompareRow[] {
  return [
    buildNumericRow(
      'price',
      'Giá bán',
      'VND',
      'lower',
      products.map((p) => `${formatViNumber(p.priceVnd)} ₫`),
      products.map((p) => p.priceVnd),
    ),
    buildNumericRow(
      'score',
      'Điểm benchmark',
      null,
      'higher',
      products.map((p) =>
        p.normalizedScore === null
          ? 'Chưa có dữ liệu'
          : `${formatViNumber(p.normalizedScore, 1)} (${formatViNumber(p.passmarkRaw)})`,
      ),
      products.map((p) => p.normalizedScore),
    ),
  ];
}

function formatCoresThreads(cpu: CompareCpuInput): string {
  return formatCpuCoresThreads(cpu.coresTotal, cpu.threadsTotal, cpu.pCores, cpu.eCores);
}

function resolveGpuCoresLabel(gpus: readonly CompareGpuInput[]): string {
  const order: GpuVendor[] = ['nvidia', 'amd', 'intel'];
  const vendors = new Set(gpus.map((g) => g.vendor));
  return order
    .filter((v) => vendors.has(v))
    .map(resolveSingleGpuCoresLabel)
    .join(' / ');
}

export function buildCompareRows(
  category: Category,
  products: readonly CompareProductInput[],
): CompareRow[] {
  const lead = buildSharedLeadRows(products);

  if (category === 'cpu') {
    const cpus = products as readonly CompareCpuInput[];
    return [
      ...lead,
      buildTextRow('architecture', 'Kiến trúc', null, cpus.map((c) => c.architecture)),
      buildTextRow('socket', 'Socket', null, cpus.map((c) => c.socket)),
      buildTextRow('processNode', 'Tiến trình', null, cpus.map((c) => c.processNode)),
      buildNumericRow(
        'coresThreads',
        'Số nhân / luồng',
        null,
        'higher',
        cpus.map(formatCoresThreads),
        // Composite key breaks core ties by total threads without precision loss.
        cpus.map((c) => c.coresTotal * 10_000 + c.threadsTotal),
      ),
      buildTextRow(
        'baseClock',
        'Xung nhịp cơ bản',
        'GHz',
        cpus.map((c) => `${formatViNumber(c.baseClockGhz, 2)} GHz`),
      ),
      buildTextRow(
        'boostClock',
        'Xung nhịp boost',
        'GHz',
        cpus.map((c) => `${formatViNumber(c.boostClockGhz, 2)} GHz`),
      ),
      buildTextRow(
        'cache',
        'Bộ nhớ đệm',
        null,
        cpus.map((c) => c.cacheText),
      ),
      buildTextRow(
        'tdp',
        'Công suất tỏa nhiệt (TDP)',
        'W',
        cpus.map((c) => `${formatViNumber(c.tdpW)} W`),
      ),
      buildTextRow('ramSupport', 'Chuẩn RAM hỗ trợ', null, cpus.map((c) => c.ramSupport)),
    ];
  }

  const gpus = products as readonly CompareGpuInput[];
  return [
    ...lead,
    buildNumericRow(
      'vram',
      'Dung lượng VRAM',
      'GB',
      'higher',
      gpus.map((g) => `${formatViNumber(g.vramGb)} GB`),
      gpus.map((g) => g.vramGb),
    ),
    buildNumericRow(
      'cores',
      resolveGpuCoresLabel(gpus),
      null,
      'higher',
      gpus.map((g) => formatViNumber(g.cores)),
      gpus.map((g) => g.cores),
    ),
    buildTextRow(
      'tdp',
      'Công suất tiêu thụ (TBP)',
      'W',
      gpus.map((g) => `${formatViNumber(g.tbpW)} W`),
    ),
    buildTextRow(
      'baseClock',
      'Xung nhịp cơ bản',
      'MHz',
      gpus.map((g) => `${formatViNumber(g.baseClockMhz)} MHz`),
    ),
    buildTextRow(
      'boostClock',
      'Xung nhịp boost',
      'MHz',
      gpus.map((g) => `${formatViNumber(g.boostClockMhz)} MHz`),
    ),
    buildTextRow('memoryType', 'Loại bộ nhớ', null, gpus.map((g) => g.memoryType)),
    buildNumericRow(
      'busWidth',
      'Độ rộng bus bộ nhớ',
      'bit',
      'higher',
      gpus.map((g) => `${formatViNumber(g.busWidthBit)} bit`),
      gpus.map((g) => g.busWidthBit),
    ),
  ];
}
