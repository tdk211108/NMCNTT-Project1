'use client';

import type { Category } from '@/shared/types';
import { useCatalogController } from '../useCatalogController';
import { CatalogView } from './CatalogView';

export function CatalogClient({
  category,
  initialSeriesId,
}: {
  category: Category;
  initialSeriesId?: string;
}) {
  const vm = useCatalogController(category, initialSeriesId);
  return <CatalogView {...vm} />;
}
