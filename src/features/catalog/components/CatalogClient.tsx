'use client';

import type { Category } from '@/shared/types';
import { useCatalogController } from '../useCatalogController';
import { CatalogView } from './CatalogView';

export function CatalogClient({ category }: { category: Category }) {
  const vm = useCatalogController(category);
  return <CatalogView {...vm} />;
}
