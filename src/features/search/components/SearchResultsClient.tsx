'use client';

import { SearchResultsView } from '@/features/search/components/SearchResultsView';
import { useSearchResultsController } from '@/features/search/useSearchResultsController';

export function SearchResultsClient({ query }: { query: string }) {
  const vm = useSearchResultsController(query);
  return <SearchResultsView {...vm} />;
}
