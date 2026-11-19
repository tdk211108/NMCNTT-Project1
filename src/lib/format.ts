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

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount);
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
