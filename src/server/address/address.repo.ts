import 'server-only';

import rawUnits from '@/data/vn-admin-units.json';
import type { AddressOption } from '@/shared/types';

interface RawWard {
  Code: string;
  FullName: string;
  ProvinceCode: string;
}

interface RawProvince {
  Code: string;
  FullName: string;
  Wards: RawWard[];
}

interface IndexedProvince {
  code: string;
  name: string;
  wards: AddressOption[];
  wardByCode: Map<string, string>;
}

const viCollator = new Intl.Collator('vi');

let cachedProvinces: AddressOption[] | null = null;
let cachedProvinceMap: Map<string, IndexedProvince> | null = null;

function ensureIndex(): {
  provinces: AddressOption[];
  provinceMap: Map<string, IndexedProvince>;
} {
  if (cachedProvinces && cachedProvinceMap) {
    return { provinces: cachedProvinces, provinceMap: cachedProvinceMap };
  }

  const provincesList: AddressOption[] = [];
  const provinceMap = new Map<string, IndexedProvince>();

  for (const province of rawUnits as RawProvince[]) {
    const wards: AddressOption[] = province.Wards.map((w) => ({
      code: w.Code,
      name: w.FullName,
    })).sort((a, b) => viCollator.compare(a.name, b.name));

    const wardByCode = new Map(wards.map((w) => [w.code, w.name]));

    provincesList.push({ code: province.Code, name: province.FullName });
    provinceMap.set(province.Code, {
      code: province.Code,
      name: province.FullName,
      wards,
      wardByCode,
    });
  }

  provincesList.sort((a, b) => viCollator.compare(a.name, b.name));

  cachedProvinces = provincesList;
  cachedProvinceMap = provinceMap;
  return { provinces: provincesList, provinceMap };
}

export function listProvinces(): AddressOption[] {
  return ensureIndex().provinces;
}

export function listWardsByProvince(provinceCode: string): AddressOption[] | null {
  const entry = ensureIndex().provinceMap.get(provinceCode);
  return entry ? entry.wards : null;
}

export function resolveProvinceAndWard(
  provinceCode: string,
  wardCode: string,
): { provinceName: string; wardName: string } | null {
  const province = ensureIndex().provinceMap.get(provinceCode);
  if (!province) {
    return null;
  }
  const wardName = province.wardByCode.get(wardCode);
  if (!wardName) {
    return null;
  }
  return { provinceName: province.name, wardName };
}
