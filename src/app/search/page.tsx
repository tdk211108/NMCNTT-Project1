import type { Metadata } from 'next';
import { SearchResultsClient } from '@/features/search/components/SearchResultsClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.catalog.searchResultsTitle,
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SearchResultsClient query={typeof q === 'string' ? q : ''} />;
}
