import type { Metadata } from 'next';
import { CatalogClient } from '@/features/catalog/components/CatalogClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.catalog.gpuPageTitle,
  description: VI_MESSAGES.home.browseGpuDesc,
});

export default function GpuListingPage() {
  return <CatalogClient category="gpu" />;
}
