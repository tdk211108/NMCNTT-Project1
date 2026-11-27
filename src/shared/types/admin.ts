import type { CpuVendor, GpuSeriesKind, GpuVendor, OrderStage } from './common';

export interface AdminCpuListItem {
  id: string;
  category: 'cpu';
  name: string;
  priceVnd: number;
  imageUrl: string | null;
  imageStoragePath: string | null;
  isSeed: boolean;
  updatedAt: string;
  vendor: CpuVendor;
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
  psuPowerW: number;
  ramSupport: string;
  passmarkRaw: number;
  passmarkSource: string;
}

export interface AdminGpuSeriesSummary {
  id: string;
  name: string;
  vendor: GpuVendor;
  vramGb: number;
  tbpW: number;
  cores: number;
  baseClockMhz: number;
  boostClockMhz: number;
  memoryType: string;
  busWidthBit: number;
  passmarkRaw: number;
  passmarkSource: string;
}

export interface AdminGpuVariantListItem {
  id: string;
  category: 'gpu';
  name: string;
  priceVnd: number;
  imageUrl: string | null;
  imageStoragePath: string | null;
  isSeed: boolean;
  updatedAt: string;
  seriesId: string;
  aibBrand: string;
  isLimitedEdition: boolean;
  lengthMm: number;
  slotThickness: number;
  hdmiCount: number;
  dpCount: number;
  series: AdminGpuSeriesSummary;
}

export type AdminProductListItem = AdminCpuListItem | AdminGpuVariantListItem;

export interface AdminProductPageResponse {
  items: AdminProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  existingSockets: string[];
  existingAibBrands: string[];
}

export interface AdminGpuSeriesItem {
  id: string;
  kind: GpuSeriesKind;
  name: string;
  vendor: GpuVendor;
  vramGb: number;
  tbpW: number;
  cores: number | null;
  baseClockMhz: number | null;
  boostClockMhz: number | null;
  memoryType: string | null;
  busWidthBit: number | null;
  passmarkRaw: number | null;
  passmarkSource: string | null;
  isSeed: boolean;
  activeVariantCount: number;
  updatedAt: string;
}

export interface AdminLegacyCpuItem {
  id: string;
  name: string;
  vendor: CpuVendor;
  socket: string | null;
  coresTotal: number | null;
  threadsTotal: number | null;
  psuPowerW: number;
  passmarkRaw: number | null;
  passmarkSource: string | null;
  isSeed: boolean;
  updatedAt: string;
}

export interface AdminOrderListItem {
  orderId: string;
  customerName: string;
  phone: string;
  totalVnd: number;
  stage: OrderStage;
  stageLabel: string;
  isCancelled: boolean;
  cancelledAt: string | null;
  createdAt: string;
}

export interface AdminImageUploadResponse {
  url: string;
  storagePath: string;
}

export interface AdminResetResponse {
  ordersDeleted: number;
  productsRestored: number;
  imagesPurged: number;
  warnings: string[];
}
