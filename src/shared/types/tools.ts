import type { Category, ChipVendor, Score } from './common';

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
  products: { id: string; name: string; priceVnd: number }[];
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

export interface PerfPerPriceResponse {
  category: Category;
  maxPriceVnd: number | null;
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
