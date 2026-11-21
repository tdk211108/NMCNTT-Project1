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
      className={`mtx-shadow w-full overflow-x-auto rounded-card border-2 border-border-strong bg-surface focus-visible:outline-2 focus-visible:outline-signal ${className}`}
    >
      {children}
    </div>
  );
}
