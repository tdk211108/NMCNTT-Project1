'use client';

import { useRef } from 'react';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { useSearchSuggest } from './useSearchSuggest';

export function SearchBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, actions } = useSearchSuggest();

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          actions.onBlurClose();
        }
      }}
    >
      <search>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            actions.onSubmit();
          }}
          className="flex w-full gap-2"
        >
          <input
            type="search"
            value={state.query}
            onChange={(e) => actions.onChangeQuery(e.target.value)}
            onFocus={actions.onFocus}
            onKeyDown={(e) => {
              const handled = actions.onKeyDown(e.key, e.nativeEvent.isComposing);
              if (handled) {
                e.preventDefault();
              }
            }}
            placeholder={VI_MESSAGES.nav.searchPlaceholder}
            aria-label={VI_MESSAGES.nav.searchPlaceholder}
            autoComplete="off"
            spellCheck={false}
            data-testid={TEST_IDS.header.searchInput}
            className="min-h-10 w-full rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            data-testid={TEST_IDS.header.searchSubmit}
            className="min-h-10 shrink-0 rounded-control border border-border-strong bg-surface-elevated px-3 text-sm font-medium text-ink hover:bg-surface-subtle"
          >
            {VI_MESSAGES.nav.searchSubmit}
          </button>
        </form>
      </search>

      {state.isOpen ? (
        <div
          role="listbox"
          className="absolute right-0 left-0 z-40 mt-1 overflow-hidden rounded-card border border-border-strong bg-surface-elevated shadow-xl"
        >
          {state.suggestions.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={idx === state.activeIndex}
              data-testid={TEST_IDS.header.searchSuggestion(item.id)}
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
                <p className="text-xs text-ink-muted">
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
