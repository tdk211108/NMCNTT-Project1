import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { UiSoundKind } from '@/lib/ui-sound';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'demo';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  cyber?: boolean;
  cyberTag?: string;
  sfx?: UiSoundKind | 'none';
  children?: ReactNode;
}

const FLAT_VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-fg border-border-strong mtx-shadow-sm hover:bg-[var(--color-primary-hover)] hover:border-ink active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  secondary:
    'bg-surface-elevated text-ink border-border-strong mtx-shadow-sm hover:border-signal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  outline:
    'bg-surface text-ink border-border-strong mtx-shadow-sm hover:border-signal hover:text-accent-ink active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  ghost:
    'bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-surface-subtle hover:border-border',
  danger:
    'bg-danger text-danger-fg border-border-strong mtx-shadow-sm hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
  demo:
    'bg-demo-bg text-demo-fg border-2 border-dashed border-demo-border mtx-shadow-sm hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none',
};

const CYBER_VARIANT_CLASSES: Partial<Record<ButtonVariant, string>> = {
  primary: 'mtx-cyber-btn mtx-cyber-primary',
  secondary: 'mtx-cyber-btn mtx-cyber-secondary',
  outline: 'mtx-cyber-btn mtx-cyber-outline',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 py-1.5 text-sm',
  md: 'min-h-11 px-4.5 py-2 text-sm',
  lg: 'min-h-12 px-5.5 py-2.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  cyber,
  cyberTag,
  sfx,
  disabled,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cyberClass = CYBER_VARIANT_CLASSES[variant];
  const useCyber = Boolean(cyberClass) && (cyber ?? true);
  const effectiveDisabled = Boolean(disabled || isLoading);
  const variantClasses = useCyber ? cyberClass! : FLAT_VARIANT_CLASSES[variant];

  return (
    <button
      type={type}
      disabled={effectiveDisabled}
      data-sfx={sfx}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border-2 font-semibold tracking-wide motion-safe:transition-[transform,box-shadow,background-color,border-color,color] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {useCyber ? <span aria-hidden="true" className="mtx-cyber-face" /> : null}
      {useCyber && cyberTag ? (
        <span aria-hidden="true" className="mtx-cyber-tag">
          {cyberTag}
        </span>
      ) : null}

      {isLoading ? (
        <span
          aria-hidden="true"
          className="relative z-10 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      ) : null}

      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">{children}</span>

      {useCyber && !effectiveDisabled ? (
        <span aria-hidden="true" className="mtx-cyber-glitch">
          {children}
        </span>
      ) : null}
    </button>
  );
}
