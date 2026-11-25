import type { SearchableSelectGroup } from '@/components/ui/SearchableSelect';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface RetailLegacySelectConfig<T> {
  retailId?: string;
  legacyId?: string;
  getMeta: (item: T, isLegacy: boolean) => string;
  getKeywords?: (item: T) => string;
}

/** Groups retail and legacy hardware options into consistent `SearchableSelectGroup` sections. */
export function buildRetailLegacyGroups<
  T extends { id: string; name: string; vendor: string },
>(
  retail: readonly T[],
  legacy: readonly T[],
  config?: RetailLegacySelectConfig<T>,
): SearchableSelectGroup[] {
  const retailId = config?.retailId ?? 'retail';
  const legacyId = config?.legacyId ?? 'legacy';
  const mapOptions = (items: readonly T[], isLegacy: boolean) =>
    items.map((item) => ({
      value: item.id,
      label: item.name,
      meta: config ? config.getMeta(item, isLegacy) : item.vendor.toUpperCase(),
      keywords: config?.getKeywords ? config.getKeywords(item) : item.vendor,
    }));

  return [
    ...(retail.length > 0
      ? [
          {
            id: retailId,
            label: VI_MESSAGES.tools.psu.groupRetail,
            options: mapOptions(retail, false),
          },
        ]
      : []),
    ...(legacy.length > 0
      ? [
          {
            id: legacyId,
            label: VI_MESSAGES.tools.psu.groupLegacy,
            options: mapOptions(legacy, true),
          },
        ]
      : []),
  ];
}
