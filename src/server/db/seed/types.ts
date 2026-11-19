import 'server-only';

import type { CpuVendor, GpuVendor } from '@/shared/types';

export interface RetailCpuSeed {
  id: string;
  name: string;
  vendor: CpuVendor;
  priceVnd: number;
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
  ramSupport: string;
  tdpW: number;
  psuPowerW: number;
  passmarkRaw: number;
  passmarkSource: 'PassMark';
  imageFile: string;
  sourceUrl: string;
}

export interface RetailGpuSeriesSeed {
  id: string;
  kind: 'retail';
  name: string;
  vendor: GpuVendor;
  vramGb: number;
  cores: number;
  baseClockMhz: number;
  boostClockMhz: number;
  memoryType: string;
  busWidthBit: number;
  tbpW: number;
  passmarkRaw: number;
  passmarkSource: 'PassMark';
  sourceUrl: string;
}

export interface GpuVariantSeed {
  id: string;
  seriesId: string;
  name: string;
  aibBrand: string;
  isLimitedEdition?: boolean;
  priceVnd: number;
  lengthMm: number;
  slotThickness: number;
  hdmiCount: number;
  dpCount: number;
  imageFile: string;
  sourceUrl: string;
}

export interface LegacyCpuSeed {
  id: string;
  name: string;
  vendor: CpuVendor;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  sourceUrl: string;
}

export interface LegacyGpuSeriesSeed {
  id: string;
  kind: 'legacy';
  name: string;
  vendor: GpuVendor;
  vramGb: number;
  tbpW: number;
  sourceUrl: string;
}
