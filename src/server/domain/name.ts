import 'server-only';

import {
  FULL_NAME_MAX_LEN,
  FULL_NAME_MIN_LEN,
  NOTE_MAX_LEN,
  STREET_MAX_LEN,
  STREET_MIN_LEN,
} from '@/shared/constants';
import { normalizeWhitespaceNfc } from '@/shared/schemas/checkout';

export { normalizeWhitespaceNfc };

const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

/**
 * Normalizes an optional note string; blank notes collapse to `null`.
 */
export function normalizeOptionalNote(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = normalizeWhitespaceNfc(value);
  return normalized.length === 0 ? null : normalized;
}

export function isValidFullName(normalized: string): boolean {
  return (
    normalized.length >= FULL_NAME_MIN_LEN &&
    normalized.length <= FULL_NAME_MAX_LEN &&
    !CONTROL_CHAR_RE.test(normalized)
  );
}

export function isValidStreetAddress(normalized: string): boolean {
  return (
    normalized.length >= STREET_MIN_LEN &&
    normalized.length <= STREET_MAX_LEN &&
    !CONTROL_CHAR_RE.test(normalized)
  );
}

export function isValidNote(normalized: string | null): boolean {
  if (normalized === null) {
    return true;
  }
  return normalized.length <= NOTE_MAX_LEN && !CONTROL_CHAR_RE.test(normalized);
}

export function formatAddressLine(
  streetAddress: string,
  wardName: string,
  provinceName: string,
): string {
  return `${streetAddress}, ${wardName}, ${provinceName}`;
}

/**
 * Canonicalizes facet values (`aibBrand`, `socket`) case-insensitively
 * against existing active spellings (e.g. `"Asus"` -> `"ASUS"`).
 */
export function canonicalizeFacetValue(raw: string, existingValues: readonly string[]): string {
  const normalized = normalizeWhitespaceNfc(raw);
  const key = normalized.toLocaleLowerCase('en-US');
  for (const existing of existingValues) {
    if (existing.toLocaleLowerCase('en-US') === key) {
      return existing;
    }
  }
  return normalized;
}
