import 'server-only';

import { randomBytes } from 'node:crypto';
import {
  ORDER_ID_ALPHABET,
  ORDER_ID_PREFIX,
  ORDER_ID_RANDOM_LENGTH,
} from '@/shared/constants';

/**
 * Maps arbitrary bytes into the 32-symbol order-ID alphabet using `byte & 31`
 * (zero modulo bias because 32 evenly divides 256).
 */
export function mapBytesToOrderAlphabet(bytes: Uint8Array): string {
  let out = '';
  for (const byte of bytes) {
    out += ORDER_ID_ALPHABET[byte & 31];
  }
  return out;
}

export function generateOrderId(
  getRandomBytes: (size: number) => Uint8Array = randomBytes,
): string {
  const bytes = getRandomBytes(ORDER_ID_RANDOM_LENGTH);
  return `${ORDER_ID_PREFIX}${mapBytesToOrderAlphabet(bytes)}`;
}
