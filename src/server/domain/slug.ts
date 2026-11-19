import 'server-only';

/**
 * Converts a hardware name (including Vietnamese characters) to a lowercase ASCII kebab slug.
 */
export function slugifyHardwareName(name: string, maxLen: number): string {
  const slug = name
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const clipped = slug.slice(0, maxLen).replace(/-+$/g, '');
  return clipped.length > 0 ? clipped : 'item';
}

/**
 * Allocates a unique ID (`<prefix><slug>`, then `-2`, `-3`, ...) that does not collide
 * with any ID in `existingIds` (including soft-deleted rows).
 */
export function allocateUniqueSlug(
  prefix: string,
  name: string,
  existingIds: Iterable<string>,
  maxLen: number,
): string {
  const taken = existingIds instanceof Set ? existingIds : new Set(existingIds);
  const bodyMax = Math.max(1, maxLen - prefix.length);
  const base = `${prefix}${slugifyHardwareName(name, bodyMax)}`;

  if (!taken.has(base)) {
    return base;
  }

  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const trimmedBase = base.slice(0, maxLen - suffix.length).replace(/-+$/g, '');
    const candidate = `${trimmedBase}${suffix}`;
    if (!taken.has(candidate)) {
      return candidate;
    }
  }
}

/**
 * Allocates the next legacy ID (`C25`, `G34`, ...) strictly above every existing ID.
 */
export function allocateNextLegacyId(prefix: 'C' | 'G', existingIds: Iterable<string>): string {
  const pattern = new RegExp(`^${prefix}([0-9]+)$`);
  let maxNumber = 0;

  for (const id of existingIds) {
    const match = pattern.exec(id);
    if (!match) continue;
    const parsed = Number(match[1]);
    if (parsed > maxNumber) {
      maxNumber = parsed;
    }
  }

  return `${prefix}${String(maxNumber + 1).padStart(2, '0')}`;
}
