import { describe, expect, it } from 'vitest';
import {
  canonicalizeFacetValue,
  formatAddressLine,
  isValidFullName,
  isValidNote,
  isValidStreetAddress,
  normalizeOptionalNote,
  normalizeWhitespaceNfc,
} from '@/server/domain/name';

describe('domain/name', () => {
  it('normalizes NFC and collapses internal whitespace', () => {
    const decomposed = 'Nguye\u0302\u0303n   Va\u0306n   A ';
    expect(normalizeWhitespaceNfc(decomposed)).toBe('Nguyễn Văn A');
  });

  it('normalizes optional notes to null when empty or omitted', () => {
    expect(normalizeOptionalNote(undefined)).toBeNull();
    expect(normalizeOptionalNote(null)).toBeNull();
    expect(normalizeOptionalNote('   \t  ')).toBeNull();
    expect(normalizeOptionalNote('  Giao   giờ   hành chính  ')).toBe('Giao giờ hành chính');
  });

  it('validates full name, street address, and note rules', () => {
    expect(isValidFullName('An')).toBe(true);
    expect(isValidFullName('A')).toBe(false);
    expect(isValidFullName('A'.repeat(51))).toBe(false);
    expect(isValidFullName('Nguyễn\nVăn A')).toBe(false);

    expect(isValidStreetAddress('12 Nguyễn Huệ')).toBe(true);
    expect(isValidStreetAddress('Ngắn')).toBe(false);
    expect(isValidStreetAddress('A'.repeat(201))).toBe(false);
    expect(isValidStreetAddress('123456789\u0000A')).toBe(false);

    expect(isValidNote(null)).toBe(true);
    expect(isValidNote('Giao trước 17h')).toBe(true);
    expect(isValidNote('A'.repeat(301))).toBe(false);
    expect(isValidNote('Ghi chú\u0007')).toBe(false);
  });

  it('formats full Vietnamese address line and canonicalizes facets case-insensitively', () => {
    expect(formatAddressLine('12 Nguyễn Huệ', 'Phường Sài Gòn', 'Thành phố Hồ Chí Minh')).toBe(
      '12 Nguyễn Huệ, Phường Sài Gòn, Thành phố Hồ Chí Minh',
    );
    expect(canonicalizeFacetValue(' asus ', ['MSI', 'ASUS', 'GIGABYTE'])).toBe('ASUS');
    expect(canonicalizeFacetValue('  ASRock  ', ['MSI', 'ASUS'])).toBe('ASRock');
  });
});
