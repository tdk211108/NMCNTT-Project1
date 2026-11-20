import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'demo';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'aero-pill-cta rounded-full border hover:brightness-105',
  secondary:
    'aero-glass rounded-control text-ink hover:border-border-strong hover:bg-surface-elevated',
  outline:
    'rounded-control bg-surface-subtle/85 text-ink border-border-strong shadow-[inset_0_1px_0_var(--aero-specular)] hover:bg-surface-elevated',
  ghost:
    'rounded-control bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-surface-subtle',
  danger:
    'rounded-full bg-danger text-danger-fg border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_12px_rgba(220,38,38,0.28)] hover:brightness-105',
  demo:
    'rounded-control bg-demo-bg text-demo-fg border-2 border-dashed border-demo-border hover:brightness-105',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-[13px]',
  md: 'min-h-11 px-4.5 py-2 text-sm',
  lg: 'min-h-12 px-6 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border font-semibold transition-[transform,opacity,box-shadow,border-color,background-color,filter] duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      <span className="relative z-1 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
