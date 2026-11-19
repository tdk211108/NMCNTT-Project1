import { describe, expect, it } from 'vitest';
import {
  isValidVnPhone,
  normalizeAndValidateVnPhone,
  normalizeVnPhone,
} from '@/server/domain/phone';
import { maskPhone } from '@/server/domain/masking';

describe('domain/phone and domain/masking', () => {
  it.each([
    ['0912345789', '0912345789'],
    ['0912 345 789', '0912345789'],
    ['0912.345.789', '0912345789'],
    ['0912-345-789', '0912345789'],
    ['+84912345789', '0912345789'],
    ['+84 38-123.4567', '0381234567'],
    ['84561234567', '0561234567'],
    ['84701234567', '0701234567'],
    ['84881234567', '0881234567'],
  ])('normalizes and accepts valid phone %s -> %s', (raw, expected) => {
    expect(normalizeVnPhone(raw)).toBe(expected);
    expect(isValidVnPhone(expected)).toBe(true);
    expect(normalizeAndValidateVnPhone(raw)).toBe(expected);
  });

  it.each([
    '',
    '0123456789',
    '0241234567',
    '0412345678',
    '0612345678',
    '091234567',
    '09123456789',
    '091234567a',
    '+84123456789',
  ])('rejects invalid phone %s', (raw) => {
    expect(normalizeAndValidateVnPhone(raw)).toBeNull();
  });

  it('masks normalized phone numbers and handles short inputs safely', () => {
    expect(maskPhone('0912345789')).toBe('0912***789');
    expect(maskPhone('123456')).toBe('***');
  });
});
