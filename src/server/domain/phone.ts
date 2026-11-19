import 'server-only';

import { VN_PHONE_REGEX } from '@/shared/constants';
import { normalizeVnPhone } from '@/shared/schemas/checkout';

export { normalizeVnPhone };

export function isValidVnPhone(normalizedPhone: string): boolean {
  return VN_PHONE_REGEX.test(normalizedPhone);
}

export function normalizeAndValidateVnPhone(rawPhone: string): string | null {
  const normalized = normalizeVnPhone(rawPhone);
  return isValidVnPhone(normalized) ? normalized : null;
}
