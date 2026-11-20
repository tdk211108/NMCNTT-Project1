import { Icon } from '@iconify/react/dist/offline';
import type { ReactNode } from 'react';
import { SOLAR_ICONS, type SolarIconName } from './solar-icons.data';

export type { SolarIconName };

export interface SolarIconProps {
  name: SolarIconName;
  className?: string;
  size?: number | string;
  withShadow?: boolean;
}

export function SolarIcon({
  name,
  className = 'h-5 w-5',
  size,
  withShadow = true,
}: SolarIconProps) {
  return (
    <Icon
      icon={SOLAR_ICONS[name]}
      ssr
      aria-hidden="true"
      width={size}
      height={size}
      className={`shrink-0 ${withShadow ? 'drop-shadow-[0_2px_4px_rgba(22,163,74,0.24)]' : ''} ${className}`}
    />
  );
}

export function AeroIconBadge({
  name,
  size = 'md',
  className = '',
  children,
}: {
  name?: SolarIconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: ReactNode;
}) {
  const boxClass =
    size === 'sm' ? 'h-9 w-9' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';
  const iconClass =
    size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <span className={`aero-icon-badge text-primary ${boxClass} ${className}`}>
      {name ? <SolarIcon name={name} className={iconClass} /> : children}
    </span>
  );
}

export function CartPlusIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return <SolarIcon name="cart-plus-bold-duotone" className={className} />;
}
