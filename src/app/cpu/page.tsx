'use client';

import { CatalogView } from '@/features/catalog/components/CatalogView';
import { useCatalogController } from '@/features/catalog/useCatalogController';

export default function CpuListingPage() {
  const vm = useCatalogController('cpu');
  return <CatalogView {...vm} />;
}
