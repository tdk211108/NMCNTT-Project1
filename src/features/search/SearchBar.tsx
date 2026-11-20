'use client';

import { useRef } from 'react';
import { SolarIcon } from '@/components/ui/Icons';
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
          <div className="relative flex-1">
            <SolarIcon
              name="magnifer-bold-duotone"
              withShadow={false}
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-primary"
            />
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
              className="min-h-10 w-full rounded-full border border-border-strong bg-surface-elevated/90 py-1.5 pr-4 pl-10 text-sm text-ink shadow-[inset_0_1px_2px_rgba(15,23,42,0.06),inset_0_-1px_0_var(--aero-specular)] placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <button
            type="submit"
            data-testid={TEST_IDS.header.searchSubmit}
            className="aero-glass min-h-10 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold text-ink transition-[transform,border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-elevated active:scale-95"
          >
            {VI_MESSAGES.nav.searchSubmit}
          </button>
        </form>
      </search>

      {state.isOpen ? (
        <div
          role="listbox"
          className="aero-glass-elevated absolute right-0 left-0 z-40 mt-2 overflow-hidden rounded-card"
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
              className={`flex w-full cursor-pointer items-center gap-3 border-b border-border/60 px-3.5 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-surface-subtle ${
                idx === state.activeIndex ? 'bg-surface-subtle' : ''
              }`}
            >
              <ProductImage
                src={item.imageUrl}
                alt={item.name}
                className="h-10 w-10 shrink-0 object-contain p-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{item.name}</p>
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
