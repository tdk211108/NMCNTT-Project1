const vndFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Ho_Chi_Minh',
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
});

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
}

/**
 * Formats integer money input digits with comma thousands separators (e.g. "20,000,000").
 * Strips currency symbols, dots, spaces, and non-digit characters safely.
 */
export function formatCommaNumberInput(raw: string | number): string {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) {
      return '';
    }
    return Math.trunc(raw)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Parses a price or budget string containing optional commas, dots, spaces, or VND symbols.
 */
export function parsePriceInputDigits(raw: string): number | null {
  const cleaned = raw.replace(/[\s.,₫đ]/gi, '').trim();
  if (!cleaned || !/^\d+$/.test(cleaned)) {
    return null;
  }
  const parsed = Number(cleaned);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function formatNumberVi(value: number, fractionDigits?: number): string {
  return value.toLocaleString(
    'vi-VN',
    fractionDigits === undefined
      ? undefined
      : {
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        },
  );
}

export function formatExactWatts(watts: number): string {
  return `${watts.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} W`;
}

export function formatDateTimeVi(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  return dateTimeFormatter.format(parsed);
}

export function formatDateVi(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  return dateFormatter.format(parsed);
}

export function getProfileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'CR';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0].charAt(0);
  const last = parts[parts.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
}
