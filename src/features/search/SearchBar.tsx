'use client';

import { Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useSearchSuggest } from './useSearchSuggest';

export interface SearchBarProps {
  compactTrigger?: boolean;
}

/**
 * Lightswind Expandable Search anchored at the end of the Navigation bar.
 * Renders as a single compact Search icon at rest, expanding smoothly on click
 * to reveal the 296px search capsule + autocomplete suggestions without a full row.
 */
export function SearchBar({ compactTrigger = false }: SearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { state, actions } = useSearchSuggest();

  const openState = isExpanded || state.query.trim().length > 0 || state.isOpen;

  if (!openState) {
    return (
      <button
        type="button"
        onClick={() => {
          setIsExpanded(true);
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        aria-label={VI_MESSAGES.nav.expandSearchOpenAria}
        aria-expanded={false}
        data-testid={
          compactTrigger ? TEST_IDS.header.floatingSearchToggle : TEST_IDS.header.searchToggle
        }
        className="mtx-shadow-sm inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-elevated text-ink transition-colors hover:border-signal hover:text-accent-ink active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus-visible:outline-2 focus-visible:outline-signal"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          actions.onBlurClose();
          if (state.query.trim().length === 0) {
            setIsExpanded(false);
          }
        }
      }}
    >
      <search>
        <motion.form
          initial={{ width: 40, opacity: 0.85 }}
          animate={{ width: compactTrigger ? 250 : 296, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onSubmit={(event) => {
            event.preventDefault();
            actions.onSubmit();
          }}
          className="mtx-shadow-sm flex max-w-[calc(100vw-2rem)] items-center gap-1 rounded-control border-2 border-signal bg-surface p-0.5"
        >
          <input
            ref={inputRef}
            type="search"
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
            className="min-h-8 min-w-0 flex-1 bg-transparent px-2.5 py-1 text-sm text-ink placeholder:text-ink-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />

          <button
            type="button"
            onClick={() => {
              actions.onChangeQuery('');
              actions.onBlurClose();
              setIsExpanded(false);
            }}
            aria-label={VI_MESSAGES.nav.expandSearchCloseAria}
            className="inline-flex h-8 w-7 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <button
            type="submit"
            aria-label={VI_MESSAGES.nav.searchSubmit}
            data-testid={compactTrigger ? undefined : TEST_IDS.header.searchSubmit}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-strong bg-primary text-primary-fg hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-signal"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          </button>
        </motion.form>
      </search>

      {state.isOpen ? (
        <div
          role="listbox"
          className="mtx-shadow absolute right-0 z-40 mt-1 w-full min-w-[260px] overflow-hidden rounded-card border-2 border-border-strong bg-surface-elevated"
        >
          {state.suggestions.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === state.activeIndex}
              data-testid={compactTrigger ? undefined : TEST_IDS.header.searchSuggestion(item.id)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => actions.onSelectSuggestion(item.id)}
              className={`flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-surface-subtle ${
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
      ) : null}
    </div>
  );
}
