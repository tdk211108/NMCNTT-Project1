'use client';

import { CatalogView } from '@/features/catalog/components/CatalogView';
import { useCatalogController } from '@/features/catalog/useCatalogController';

export default function GpuListingPage() {
  const vm = useCatalogController('gpu');
  return <CatalogView {...vm} />;
}
