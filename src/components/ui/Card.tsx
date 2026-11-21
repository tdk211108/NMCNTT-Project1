import type { HTMLAttributes, ReactNode } from 'react';
import type { ChipVendor } from '@/shared/types';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`mtx-shadow rounded-card border-2 border-border-strong bg-surface p-4 text-ink ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export type BadgeVariant =
  | 'default'
  | 'aib'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'demo'
  | 'nvidia'
  | 'amd'
  | 'intel';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-ink border-border',
  aib: 'bg-surface-elevated text-ink border-border-strong',
  accent: 'bg-accent text-accent-fg border-border-strong font-semibold',
  success: 'bg-highlight text-highlight-fg border-success/60',
  warning: 'bg-warning/20 text-warning border-warning/60',
  danger: 'bg-danger/20 text-danger border-danger/60',
  demo: 'bg-demo-bg text-demo-fg border-dashed border-demo-border',
  nvidia: 'bg-[#76B900] text-[#0A1400] border-[#76B900] font-semibold',
  amd: 'bg-[#ED1C24] text-white border-[#ED1C24] font-semibold',
  intel: 'bg-[#0068B5] text-white border-[#0068B5] font-semibold',
};

const VENDOR_BADGE_MAP: Record<ChipVendor, BadgeVariant> = {
  nvidia: 'nvidia',
  amd: 'amd',
  intel: 'intel',
};

export function vendorBadgeVariant(vendor: ChipVendor): BadgeVariant {
  return VENDOR_BADGE_MAP[vendor];
}

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-control border-2 px-2 py-0.5 font-mono text-xs font-medium tracking-wide ${BADGE_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
