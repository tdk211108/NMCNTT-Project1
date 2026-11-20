import type { ReactNode } from 'react';

export function ResponsiveTableWrapper({
  label,
  className = '',
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={label}
      className={`aero-glass w-full overflow-x-auto rounded-card focus-visible:outline-2 focus-visible:outline-accent ${className}`}
    >
      {children}
    </div>
  );
}
