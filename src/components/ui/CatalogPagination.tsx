'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export interface CatalogPaginationProps {
  scope: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

type PaginationToken = number | 'left-ellipsis' | 'right-ellipsis';

export function buildPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 1) {
    return [1];
  }
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  }

  const tokens: PaginationToken[] = [1];
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  if (windowStart > 2) {
    tokens.push('left-ellipsis');
  }
  for (let p = windowStart; p <= windowEnd; p += 1) {
    tokens.push(p);
  }
  if (windowEnd < totalPages - 1) {
    tokens.push('right-ellipsis');
  }

  tokens.push(totalPages);
  return tokens;
}

/**
 * Semantic div/button pagination bar (zero <ul>/<ol> per CoreRaster UI guardrails)
 * with Animate UI spring sliding pill and dynamic page expansion when exceeding page size.
 */
export function CatalogPagination({
  scope,
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: CatalogPaginationProps) {
  const prefersReduced = useReducedMotion();

  if (totalItems <= 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const tokens = buildPaginationTokens(safePage, totalPages);

  return (
    <LayoutGroup id={`catalog-pagination-${scope}`}>
      <nav
        aria-label={VI_MESSAGES.common.paginationAria}
        data-testid={TEST_IDS.listing.pagination(scope)}
        className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-border-strong bg-surface px-3 py-2.5"
      >
        <span className="font-mono text-xs tabular-nums text-ink-muted">
          {VI_MESSAGES.common.pageIndicator(safePage, totalPages)} ({totalItems})
        </span>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            aria-label={VI_MESSAGES.common.previousPage}
            data-testid={TEST_IDS.listing.paginationPrev(scope)}
            onClick={() => onPageChange(safePage - 1)}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-control border-2 border-border-strong bg-surface-elevated px-2.5 text-xs font-semibold text-ink hover:border-signal hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{VI_MESSAGES.common.previousPage}</span>
          </button>

          {tokens.map((token) =>
            typeof token === 'number' ? (
              <button
                key={token}
                type="button"
                aria-current={token === safePage ? 'page' : undefined}
                data-testid={TEST_IDS.listing.paginationPage(scope, token)}
                onClick={() => onPageChange(token)}
                className={`relative inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-control border-2 px-2.5 font-mono text-xs font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-signal ${
                  token === safePage
                    ? 'border-border-strong text-primary-fg'
                    : 'border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink'
                }`}
              >
                {token === safePage ? (
                  <motion.span
                    layoutId={`catalog-page-pill-${scope}`}
                    transition={
                      prefersReduced
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 32 }
                    }
                    className="mtx-shadow-sm absolute inset-0 rounded-[calc(var(--radius-control)-2px)] bg-primary"
                  />
                ) : null}
                <span className="relative z-10">{token}</span>
              </button>
            ) : (
              <span
                key={token}
                aria-hidden="true"
                className="inline-flex h-9 w-7 items-center justify-center text-ink-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ),
          )}

          <button
            type="button"
            disabled={safePage >= totalPages}
            aria-label={VI_MESSAGES.common.nextPage}
            data-testid={TEST_IDS.listing.paginationNext(scope)}
            onClick={() => onPageChange(safePage + 1)}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-control border-2 border-border-strong bg-surface-elevated px-2.5 text-xs font-semibold text-ink hover:border-signal hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            <span className="hidden sm:inline">{VI_MESSAGES.common.nextPage}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </nav>
    </LayoutGroup>
  );
}
