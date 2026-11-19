import 'server-only';

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export const SCRYPT_N = 32_768;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const SCRYPT_MAXMEM = 64 * 1024 * 1024;

interface ParsedScryptHash {
  n: number;
  r: number;
  p: number;
  salt: Buffer;
  hash: Buffer;
}

function deriveScryptKey(
  password: string,
  salt: Buffer,
  keyLen: number,
  options: { N: number; r: number; p: number; maxmem: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLen, options, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });
}

export function isValidScryptHashFormat(value: string): boolean {
  return parseScryptHash(value) !== null;
}

function parseScryptHash(stored: string): ParsedScryptHash | null {
  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return null;
  }

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (
    !Number.isInteger(n) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    n < 1024 ||
    n > 1_048_576 ||
    (n & (n - 1)) !== 0 ||
    r < 1 ||
    r > 64 ||
    p < 1 ||
    p > 16
  ) {
    return null;
  }

  if (!parts[4] || !parts[5]) {
    return null;
  }

  const salt = Buffer.from(parts[4], 'base64url');
  const hash = Buffer.from(parts[5], 'base64url');
  if (salt.length < 8 || hash.length < 16) {
    return null;
  }

  return { n, r, p, salt, hash };
}

/**
 * Generates `scrypt:<N>:<r>:<p>:<saltB64url>:<hashB64url>` using `:` separators
 * so `@next/env` does not perform `$` variable interpolation on `.env` files.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error('Password must not be empty.');
  }

  const salt = randomBytes(SALT_BYTES);
  const derived = await deriveScryptKey(password, salt, KEY_BYTES, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });

  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('base64url')}:${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password) {
    return false;
  }

  const parsed = parseScryptHash(storedHash);
  if (!parsed) {
    return false;
  }

  const derived = await deriveScryptKey(password, parsed.salt, parsed.hash.length, {
    N: parsed.n,
    r: parsed.r,
    p: parsed.p,
    maxmem: Math.max(SCRYPT_MAXMEM, 256 * parsed.n * parsed.r),
  });

  if (derived.length !== parsed.hash.length) {
    return false;
  }

  return timingSafeEqual(derived, parsed.hash);
}

export const hashAdminPassword = hashPassword;
export const verifyAdminPassword = verifyPassword;
