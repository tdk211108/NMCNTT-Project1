'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { SEARCH_SUGGEST_MAX_LEN, SEARCH_SUGGEST_MIN_LEN } from '@/shared/constants';
import type { SearchSuggestion } from '@/shared/types';

export function useSearchSuggest() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmed = query.trim();
    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmed);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const canQuery =
    debouncedQuery.length >= SEARCH_SUGGEST_MIN_LEN &&
    debouncedQuery.length <= SEARCH_SUGGEST_MAX_LEN;

  const suggestQuery = useQuery({
    queryKey: ['search', 'suggest', debouncedQuery],
    queryFn: () =>
      apiFetch<SearchSuggestion[]>(
        `/api/search/suggest?q=${encodeURIComponent(debouncedQuery)}`,
      ),
    enabled: canQuery,
    staleTime: 15_000,
  });

  const suggestions = canQuery ? (suggestQuery.data ?? []) : [];

  function submitSearch(rawValue?: string): void {
    const trimmed = (rawValue ?? query).trim();
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search');
  }

  function selectSuggestion(id: string): void {
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(`/products/${id}`);
  }

  function handleKeyDown(key: string, isComposing: boolean): boolean {
    if (isComposing) return false;
    if (key === 'ArrowDown' && suggestions.length > 0) {
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
      return true;
    }
    if (key === 'ArrowUp' && suggestions.length > 0) {
      setIsOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      return true;
    }
    if (key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return true;
    }
    if (key === 'Enter' && isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      selectSuggestion(suggestions[activeIndex].id);
      return true;
    }
    return false;
  }

  return {
    state: {
      query,
      suggestions,
      isOpen: isOpen && canQuery && suggestions.length > 0,
      activeIndex,
      isFetching: suggestQuery.isFetching,
    },
    actions: {
      onChangeQuery: (value: string) => {
        setQuery(value);
        setIsOpen(true);
        setActiveIndex(-1);
      },
      onFocus: () => setIsOpen(true),
      onBlurClose: () => setIsOpen(false),
      onSubmit: submitSearch,
      onSelectSuggestion: selectSuggestion,
      onKeyDown: handleKeyDown,
    },
  };
}
