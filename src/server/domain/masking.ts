import 'server-only';

/**
 * Masks a normalized Vietnamese phone number (`0912345789` -> `0912***789`).
 */
export function maskPhone(normalizedPhone: string): string {
  if (normalizedPhone.length < 7) {
    return '***';
  }
  return `${normalizedPhone.slice(0, 4)}***${normalizedPhone.slice(-3)}`;
}
