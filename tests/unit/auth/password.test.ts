import { describe, expect, it } from 'vitest';
import {
  hashPassword,
  isValidScryptHashFormat,
  SCRYPT_N,
  SCRYPT_P,
  SCRYPT_R,
  verifyPassword,
} from '@/server/auth/password';

describe('scrypt password helper', () => {
  it('generates colon-separated scrypt hashes without $ and verifies roundtrip', async () => {
    const hash1 = await hashPassword('CoreRasterDemo!2026');
    const hash2 = await hashPassword('CoreRasterDemo!2026');

    expect(hash1).toMatch(new RegExp(`^scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:[^:$]+:[^:$]+$`));
    expect(hash1).not.toContain('$');
    expect(hash1).not.toBe(hash2);
    expect(isValidScryptHashFormat(hash1)).toBe(true);

    expect(await verifyPassword('CoreRasterDemo!2026', hash1)).toBe(true);
    expect(await verifyPassword('CoreRasterDemo!2026', hash2)).toBe(true);
    expect(await verifyPassword('wrong-password', hash1)).toBe(false);
    expect(await verifyPassword('', hash1)).toBe(false);
  });

  it('rejects malformed scrypt hash strings safely', async () => {
    await expect(hashPassword('')).rejects.toThrow();
    expect(isValidScryptHashFormat('$scrypt$n=32768$r=8$p=1$abc$def')).toBe(false);
    expect(isValidScryptHashFormat('scrypt:123:8:1:short:hash')).toBe(false);
    expect(await verifyPassword('anything', 'invalid-hash')).toBe(false);
  });
});
