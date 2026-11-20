import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`aero-glass rounded-card p-5 text-ink ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'demo';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default:
    'bg-surface-elevated/90 text-ink border-border shadow-[inset_0_1px_0_var(--aero-specular)]',
  accent:
    'bg-accent/15 text-primary border-border-strong shadow-[inset_0_1px_0_var(--aero-specular)]',
  success:
    'bg-highlight text-highlight-fg border-success/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  warning:
    'bg-warning/15 text-warning border-warning/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]',
  danger:
    'bg-danger/15 text-danger border-danger/40',
  demo:
    'bg-demo-bg text-demo-fg border-dashed border-demo-border',
};

const VENDOR_BADGE_CLASSES: Record<string, string> = {
  nvidia:
    'bg-[#76B900] text-[#0A1D00] border-[#8CE000]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  amd:
    'bg-[#ED1C24] text-white border-[#FF6B70]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
  intel:
    'bg-[#0071C5] text-white border-[#60A5FA]/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]',
};

export function VendorBadge({
  vendor,
  className = '',
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { vendor: string }) {
  const normalized = vendor.trim().toLowerCase();
  const brandClass = VENDOR_BADGE_CLASSES[normalized] ?? BADGE_CLASSES.default;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide ${brandClass} ${className}`}
      {...rest}
    >
      {vendor.toUpperCase()}
    </span>
  );
}

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${BADGE_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
