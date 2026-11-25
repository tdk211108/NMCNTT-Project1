import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ProductSort } from '@/shared/types';

/** Returns a bounded 1-based slice of `items` together with clamped page metadata. */
export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): { page: number; totalPages: number; items: T[] } {
  const safeSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * safeSize;
  return {
    page,
    totalPages,
    items: items.slice(start, start + safeSize),
  };
}

export const PRODUCT_SORT_OPTIONS: readonly { value: ProductSort; label: string }[] = [
  { value: 'default', label: VI_MESSAGES.catalog.sortDefault },
  { value: 'price_asc', label: VI_MESSAGES.catalog.sortPriceAsc },
  { value: 'price_desc', label: VI_MESSAGES.catalog.sortPriceDesc },
  { value: 'score_desc', label: VI_MESSAGES.catalog.sortScoreDesc },
];
