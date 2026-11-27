'use client';

import { Search, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useSearchSuggest } from '../useSearchSuggest';

export interface SearchBarProps {
  compactTrigger?: boolean;
  mobilePanel?: boolean;
}

/**
 * Lightswind Expandable Search anchored at the end of the Navigation bar.
 * Expands and collapses smoothly via AnimatePresence without focus-handoff blur races,
 * and renders a full-width drop panel on mobile viewports.
 */
export function SearchBar({ compactTrigger = false, mobilePanel = false }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const prefersReduced = useReducedMotion();
  const { state, actions } = useSearchSuggest();

  const openState = isExpanded || state.query.trim().length > 0 || state.isOpen;
  const targetWidth = compactTrigger ? 250 : 296;

  useEffect(() => {
    if (!isExpanded) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isExpanded]);

  useEffect(() => {
    if (!openState) return;
    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && containerRef.current?.contains(target)) return;
      actions.onBlurClose();
      if (state.query.trim().length === 0) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDownOutside, true);
    return () => document.removeEventListener('pointerdown', onPointerDownOutside, true);
  }, [openState, state.query, actions]);

  const searchForm = (
    <search>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          actions.onSubmit();
          if (mobilePanel) {
            setIsExpanded(false);
          }
        }}
        className="mtx-shadow-sm flex w-full items-center gap-1 rounded-control border-2 border-signal bg-surface p-0.5"
      >
        <input
          ref={inputRef}
          type="search"
          autoFocus
          value={state.query}
          onChange={(e) => actions.onChangeQuery(e.target.value)}
          onFocus={actions.onFocus}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !state.isOpen && state.query.trim().length === 0) {
              setIsExpanded(false);
              return;
            }
            const handled = actions.onKeyDown(e.key, e.nativeEvent.isComposing);
            if (handled) {
              e.preventDefault();
            }
          }}
          placeholder={VI_MESSAGES.nav.searchPlaceholder}
          aria-label={VI_MESSAGES.nav.searchPlaceholder}
          autoComplete="off"
          spellCheck={false}
          data-testid={
            compactTrigger ? TEST_IDS.header.floatingSearchInput : TEST_IDS.header.searchInput
          }
          className="min-h-9 min-w-0 flex-1 bg-transparent px-2.5 py-1 text-base text-ink placeholder:text-ink-muted focus:outline-none sm:min-h-8 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
        />

        <button
          type="button"
          onClick={() => {
            actions.onChangeQuery('');
            actions.onBlurClose();
            setIsExpanded(false);
          }}
          aria-label={VI_MESSAGES.nav.expandSearchCloseAria}
          className="inline-flex h-9 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal sm:h-8 sm:w-7"
        >
          <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>

        <button
          type="submit"
          aria-label={VI_MESSAGES.nav.searchSubmit}
          data-testid={compactTrigger ? undefined : TEST_IDS.header.searchSubmit}
          className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-primary text-primary-fg hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-signal sm:h-8 sm:w-8"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        </button>
      </form>
    </search>
  );

  const suggestionsList = state.isOpen ? (
    <div
      role="listbox"
      className={
        mobilePanel
          ? 'mtx-shadow mt-2 max-h-[60dvh] w-full overflow-y-auto rounded-card border-2 border-border-strong bg-surface-elevated'
          : 'mtx-shadow absolute top-full right-0 z-40 mt-1 w-full min-w-[260px] overflow-hidden rounded-card border-2 border-border-strong bg-surface-elevated'
      }
    >
      {state.suggestions.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          role="option"
          aria-selected={idx === state.activeIndex}
          data-testid={compactTrigger ? undefined : TEST_IDS.header.searchSuggestion(item.id)}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            actions.onSelectSuggestion(item.id);
            if (mobilePanel) {
              setIsExpanded(false);
            }
          }}
          className={`flex min-h-12 w-full items-center gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-surface-subtle ${
            idx === state.activeIndex ? 'bg-surface-subtle' : ''
          }`}
        >
          <ProductImage
            src={item.imageUrl}
            alt={item.name}
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{item.name}</p>
            <p className="font-mono text-xs tabular-nums text-ink-muted">
              {item.category.toUpperCase()} | {formatVnd(item.priceVnd)}
            </p>
          </div>
        </button>
      ))}
    </div>
  ) : null;

  if (mobilePanel) {
    return (
      <div ref={containerRef} className="relative flex min-h-10 shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={openState ? VI_MESSAGES.nav.expandSearchCloseAria : VI_MESSAGES.nav.expandSearchOpenAria}
          aria-expanded={openState}
          data-testid={TEST_IDS.header.searchToggle}
          className={`mtx-shadow-sm inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 transition-colors focus-visible:outline-2 focus-visible:outline-signal ${
            openState
              ? 'border-signal bg-primary text-primary-fg'
              : 'border-border-strong bg-surface-elevated text-ink hover:border-signal hover:text-accent-ink'
          }`}
        >
          {openState ? (
            <X className="h-4 w-4 shrink-0" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
        </button>

        {openState ? (
          <div className="fixed inset-x-0 top-14 z-40 border-b-2 border-border-strong bg-surface/98 px-3 py-3 shadow-lg backdrop-blur-sm">
            {searchForm}
            {suggestionsList}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex min-h-10 shrink-0 items-center justify-end">
      <AnimatePresence initial={false}>
        {!openState ? (
          <motion.button
            key="search-trigger"
            type="button"
            initial={prefersReduced ? false : { opacity: 0.6, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, scale: 0.9 }}
            transition={{ duration: prefersReduced ? 0 : 0.12 }}
            onClick={() => setIsExpanded(true)}
            aria-label={VI_MESSAGES.nav.expandSearchOpenAria}
            aria-expanded={false}
            data-testid={
              compactTrigger ? TEST_IDS.header.floatingSearchToggle : TEST_IDS.header.searchToggle
            }
            className="mtx-shadow-sm inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-elevated text-ink transition-colors hover:border-signal hover:text-accent-ink active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-2 focus-visible:outline-signal"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          </motion.button>
        ) : (
          <motion.div
            key="search-expanded"
            initial={prefersReduced ? false : { width: 40, opacity: 0.85 }}
            animate={{ width: targetWidth, opacity: 1 }}
            exit={prefersReduced ? undefined : { width: 40, opacity: 0 }}
            transition={
              prefersReduced
                ? { duration: 0 }
                : { type: 'spring', stiffness: 400, damping: 32 }
            }
            className="max-w-[calc(100vw-2rem)] overflow-hidden"
          >
            {searchForm}
          </motion.div>
        )}
      </AnimatePresence>

      {suggestionsList}
    </div>
  );
}
