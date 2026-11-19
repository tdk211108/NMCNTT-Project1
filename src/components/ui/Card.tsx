import type { HTMLAttributes, ReactNode } from 'react';

export function Card({
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-4 text-ink ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'demo';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-ink border-border',
  accent: 'bg-accent text-accent-fg border-transparent',
  success: 'bg-highlight text-highlight-fg border-success/40',
  warning: 'bg-warning/20 text-warning border-warning/40',
  danger: 'bg-danger/20 text-danger border-danger/40',
  demo: 'bg-demo-bg text-demo-fg border-dashed border-demo-border',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-control border px-2 py-0.5 text-xs font-medium ${BADGE_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}
