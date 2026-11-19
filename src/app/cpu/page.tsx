import type { Metadata } from 'next';
import { CatalogClient } from '@/features/catalog/components/CatalogClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.catalog.cpuPageTitle,
  description: VI_MESSAGES.home.browseCpuDesc,
});

export default function CpuListingPage() {
  return <CatalogClient category="cpu" />;
}
