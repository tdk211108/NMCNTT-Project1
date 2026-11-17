export type Category = 'cpu' | 'gpu';
export type CpuVendor = 'intel' | 'amd';
export type GpuVendor = 'nvidia' | 'amd';
export type ChipVendor = 'intel' | 'amd' | 'nvidia';
export type GpuSeriesKind = 'retail' | 'legacy';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'card';
export type OrderStage = 0 | 1 | 2 | 3 | 4;

export interface SpecItem {
  key: string;
  label: string;
  value: string;
}

export interface SpecGroup {
  key: string;
  title: string;
  items: SpecItem[];
}

export interface Score {
  raw: number;
  normalized: number | null;
  source: string;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMPTY_CART'
  | 'CART_LIMIT_EXCEEDED'
  | 'PRODUCT_UNAVAILABLE'
  | 'COMPARE_INVALID'
  | 'NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN_ORIGIN'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'STALE_STAGE'
  | 'ORDER_COMPLETED'
  | 'HAS_VARIANTS'
  | 'DUPLICATE_NAME'
  | 'SERIES_NOT_RETAIL'
  | 'IMAGE_INVALID'
  | 'INTERNAL';

export interface ApiError {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AddressOption {
  code: string;
  name: string;
}
