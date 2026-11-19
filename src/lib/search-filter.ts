/**
 * Normalizes text for case- and Vietnamese diacritic-insensitive client filtering.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Returns true when every whitespace-separated token in `query` matches across the given fields.
 */
export function matchesSearchTokens(query: string, fields: readonly (string | null | undefined)[]): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(fields.filter(Boolean).join(' '));
  return normalizedQuery.split(/\s+/).every((token) => haystack.includes(token));
}
