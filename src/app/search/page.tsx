import { SearchResultsClient } from '@/features/search/components/SearchResultsClient';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SearchResultsClient query={typeof q === 'string' ? q : ''} />;
}
