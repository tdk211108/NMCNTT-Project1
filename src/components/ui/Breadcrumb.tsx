import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
  className?: string;
}

/**
 * Semantic hierarchical breadcrumb without `<ul>`/`<ol>` per ESLint customer-UI rules.
 * Final entry renders an `aria-current="page"` link with distinct weight and contrast.
 */
export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={VI_MESSAGES.nav.breadcrumbAria} className={className}>
      <div
        role="list"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-xs text-ink-muted"
      >
        {items.map((item, idx) => {
          const isCurrent = idx === items.length - 1;
          return (
            <div key={`${item.href}-${idx}`} role="listitem" className="inline-flex items-center gap-1.5">
              {idx > 0 ? (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
              ) : null}
              <Link
                href={item.href}
                aria-current={isCurrent ? 'page' : undefined}
                className={
                  isCurrent
                    ? 'font-semibold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal'
                    : 'transition-colors hover:text-accent-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal'
                }
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
