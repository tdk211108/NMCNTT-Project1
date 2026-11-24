import type { Category, ChipVendor, CpuVendor, GpuVendor, Score } from './common';

export type HighlightRule = 'higher' | 'lower' | 'none';

export interface CompareRow {
  key: string;
  label: string;
  unit: string | null;
  rule: HighlightRule;
  cells: { display: string; highlighted: boolean }[];
}

export interface CompareResponse {
  category: Category;
  products: { id: string; name: string; priceVnd: number; imageUrl: string | null }[];
  rows: CompareRow[];
  notes: string[];
}

export type CompareInvalidReason =
  | 'NO_IDS'
  | 'TOO_MANY'
  | 'NOT_FOUND'
  | 'MIXED_CATEGORY'
  | 'TOO_FEW';

export interface PerfPerPriceQuery {
  category: Category;
  vendor?: ChipVendor[];
  maxPriceVnd?: number;
}

export interface PerfPerPriceItem {
  rank: number;
  id: string;
  name: string;
  vendor: ChipVendor;
  aibBrand: string | null;
  priceVnd: number;
  score: Pick<Score, 'raw' | 'normalized'>;
  perfPerPrice: number;
  bestValue: boolean;
}

export type CpuAwardKey =
  | 'strongest'
  | 'best_value'
  | 'best_efficiency'
  | 'lowest_power'
  | 'cheapest'
  | 'most_expensive'
  | 'most_cores'
  | 'largest_cache';

export type GpuAwardKey =
  | 'strongest'
  | 'best_value'
  | 'best_efficiency'
  | 'lowest_power'
  | 'cheapest'
  | 'most_expensive'
  | 'most_vram'
  | 'most_compact'
  | 'largest_gpu';

export type HardwareAwardKey = CpuAwardKey | GpuAwardKey;

export interface HardwareAwardBadge {
  key: HardwareAwardKey;
  metricValue: number;
  metricDisplay: string;
}

export interface HardwareAwardSpecs {
  socket: string | null;
  coresTotal: number | null;
  threadsTotal: number | null;
  psuPowerW: number | null;
  tdpW: number | null;
  l3CacheMb: number | null;
  boostClockGhz: number | null;
  seriesName: string | null;
  vramGb: number | null;
  tbpW: number | null;
  lengthMm: number | null;
  slotThickness: number | null;
}

export interface HardwareAwardWinner {
  id: string;
  category: Category;
  name: string;
  vendor: ChipVendor;
  aibBrand: string | null;
  isLimitedEdition: boolean;
  priceVnd: number;
  imageUrl: string | null;
  score: Pick<Score, 'raw' | 'normalized'>;
  perfPerPrice: number;
  perfPerWatt: number;
  specs: HardwareAwardSpecs;
  awards: HardwareAwardBadge[];
  awardCount: number;
}

export interface PerfPerPriceResponse {
  category: Category;
  maxPriceVnd: number | null;
  totalEvaluated: number;
  awards: HardwareAwardWinner[];
  items: PerfPerPriceItem[];
  notes: string[];
}

export interface PsuOption {
  id: string;
  name: string;
  vendor: ChipVendor;
  source: 'store' | 'legacy';
}

export interface PsuOptions {
  cpus: PsuOption[];
  gpus: PsuOption[];
}

export type PsuTierW = 450 | 550 | 650 | 750 | 850 | 1000 | 1200;

export interface PsuEstimate {
  cpu: { id: string; name: string; psuPowerW: number };
  gpu: { id: string; name: string; tbpW: number };
  baseSystemW: 100;
  headroomFactor: 1.25;
  exactW: number;
  recommendedTierW: PsuTierW | null;
  exceedsMaxTier: boolean;
  notes: string[];
}

export type ComboPurpose = 'gaming_aaa' | 'esport' | 'work_ai';

export type ComboRole = 'best_overall' | 'gpu_focused' | 'performance_stretch' | 'best_value';

export interface ComboCpuSummary {
  id: string;
  name: string;
  vendor: CpuVendor;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  priceVnd: number;
  imageUrl: string | null;
  score: Pick<Score, 'raw' | 'normalized'>;
}

export interface ComboGpuSummary {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  vendor: GpuVendor;
  aibBrand: string;
  vramGb: number;
  tbpW: number;
  priceVnd: number;
  imageUrl: string | null;
  score: Pick<Score, 'raw' | 'normalized'>;
}

export interface ComboPsuSummary {
  exactW: number;
  recommendedTierW: PsuTierW | null;
  exceedsMaxTier: boolean;
  psuHref: string;
}

export interface ComboRecommendation {
  rank: number;
  role: ComboRole;
  cpu: ComboCpuSummary;
  gpu: ComboGpuSummary;
  totalPriceVnd: number;
  budgetDeltaVnd: number;
  isOverBudget: boolean;
  overBudgetPct: number | null;
  actualGpuSharePct: number;
  actualCpuSharePct: number;
  compositeScore: number;
  perfPerPrice: number;
  psu: ComboPsuSummary;
}

export interface ComboReferencePair {
  cpuId: string;
  cpuName: string;
  gpuId: string;
  gpuSeriesId: string;
  gpuName: string;
  totalPriceVnd: number;
}

export interface ComboQuery {
  budgetVnd: number;
  purpose: ComboPurpose;
  cpuVendor?: CpuVendor;
  gpuVendor?: GpuVendor;
}

export interface ComboResponse {
  budgetVnd: number;
  purpose: ComboPurpose;
  targetGpuSharePct: number;
  targetCpuSharePct: number;
  combos: ComboRecommendation[];
  minAvailableComboPriceVnd: number | null;
  cheapestReferenceCombo: ComboReferencePair | null;
  notes: string[];
}

export type UpgradeSort = 'recommended' | 'uplift_desc' | 'perf_per_price_desc' | 'price_asc';

export type UpgradeWarningSeverity = 'high' | 'medium' | 'low' | 'positive';

export type UpgradeWarningCode =
  | 'socket_change'
  | 'ram_ddr5_required'
  | 'ram_ddr4_or_ddr5'
  | 'cpu_power_increase'
  | 'gpu_tbp_high'
  | 'gpu_tbp_moderate'
  | 'gpu_large_size'
  | 'gpu_vram_decrease'
  | 'gpu_vram_increase';

export interface UpgradeWarning {
  code: UpgradeWarningCode;
  severity: UpgradeWarningSeverity;
  deltaValue?: number;
  fromLabel?: string;
  toLabel?: string;
  fromWatt?: number;
  toWatt?: number;
  lengthMm?: number;
  slotThickness?: number;
  fromVramGb?: number;
  toVramGb?: number;
}

export interface UpgradeCpuOption {
  id: string;
  name: string;
  vendor: CpuVendor;
  source: 'store' | 'legacy';
  socket: string | null;
  hasPassmark: boolean;
}

export interface UpgradeGpuOption {
  id: string;
  name: string;
  vendor: GpuVendor;
  source: 'store' | 'legacy';
  vramGb: number;
  hasPassmark: boolean;
}

export interface UpgradeOptionsResponse {
  cpus: UpgradeCpuOption[];
  gpus: UpgradeGpuOption[];
}

export interface UpgradeCurrentSummary {
  id: string;
  retailProductId: string | null;
  category: Category;
  source: 'store' | 'legacy';
  name: string;
  vendor: ChipVendor;
  socket: string | null;
  coresTotal: number | null;
  threadsTotal: number | null;
  psuPowerW: number | null;
  ramSupport: string | null;
  vramGb: number | null;
  tbpW: number | null;
  passmarkRaw: number | null;
  normalizedScore: number | null;
  hasPassmark: boolean;
}

export interface UpgradeCpuItem {
  id: string;
  name: string;
  vendor: CpuVendor;
  priceVnd: number;
  imageUrl: string | null;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  ramSupport: string;
  score: Pick<Score, 'raw' | 'normalized'>;
  perfPerPrice: number;
  upliftPct: number | null;
  sameSocket: boolean;
  warnings: UpgradeWarning[];
  psuHref: string;
  compareHref: string | null;
}

export interface UpgradeGpuItem {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  aibBrand: string;
  vendor: GpuVendor;
  priceVnd: number;
  imageUrl: string | null;
  vramGb: number;
  tbpW: number;
  lengthMm: number;
  slotThickness: number;
  variantCount: number;
  score: Pick<Score, 'raw' | 'normalized'>;
  perfPerPrice: number;
  upliftPct: number | null;
  warnings: UpgradeWarning[];
  psuHref: string;
  compareHref: string | null;
  aibVariantsHref: string;
}

export interface UpgradeQuery {
  category: Category;
  current: string;
  budgetVnd?: number;
  sameSocketOnly?: boolean;
  vendor?: ChipVendor[];
  sort?: UpgradeSort;
}

export interface UpgradeResponse {
  category: Category;
  current: UpgradeCurrentSummary;
  hasSameSocketInCatalog: boolean;
  isTopTier: boolean;
  minUpgradePriceVnd: number | null;
  sameSocketCpus: UpgradeCpuItem[];
  platformSwapCpus: UpgradeCpuItem[];
  gpus: UpgradeGpuItem[];
  notes: string[];
}
