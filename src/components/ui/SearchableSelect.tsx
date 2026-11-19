'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { matchesSearchTokens } from '@/lib/search-filter';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface SearchableSelectOption {
  value: string;
  label: string;
  meta?: string;
  keywords?: string;
}

export interface SearchableSelectGroup {
  id: string;
  label: string;
  options: readonly SearchableSelectOption[];
}

export interface SearchableSelectProps {
  label: string;
  value: string;
  groups: readonly SearchableSelectGroup[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  triggerTestId?: string;
  searchTestId?: string;
  optionTestId?: (value: string) => string;
  onChange: (value: string) => void;
}

export function SearchableSelect({
  label,
  value,
  groups,
  placeholder,
  searchPlaceholder = VI_MESSAGES.common.dropdownSearchPlaceholder,
  emptyMessage = VI_MESSAGES.common.dropdownEmptySearch,
  disabled = false,
  required = false,
  triggerTestId,
  searchTestId,
  optionTestId,
  onChange,
}: SearchableSelectProps) {
  const triggerId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedOption = useMemo(() => {
    for (const group of groups) {
      const hit = group.options.find((opt) => opt.value === value);
      if (hit) return hit;
    }
    return null;
  }, [groups, value]);

  const filteredGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: group.options.filter((opt) =>
            matchesSearchTokens(query, [group.label, opt.label, opt.meta, opt.keywords]),
          ),
        }))
        .filter((group) => group.options.length > 0),
    [groups, query],
  );

  const flatOptions = useMemo(
    () => filteredGroups.flatMap((group) => group.options),
    [filteredGroups],
  );

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  function openPanel() {
    if (disabled) return;
    setQuery('');
    setActiveIndex(0);
    setIsOpen(true);
  }

  function closePanel(returnFocus: boolean) {
    setIsOpen(false);
    setQuery('');
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  }

  function selectValue(nextValue: string) {
    onChange(nextValue);
    closePanel(true);
  }

  function scrollActiveOptionIntoView(nextIndex: number) {
    const optEl = listboxRef.current?.querySelector<HTMLElement>(
      `[data-option-idx="${nextIndex}"]`,
    );
    optEl?.scrollIntoView({ block: 'nearest' });
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel(true);
      return;
    }
    if (e.key === 'ArrowDown' && flatOptions.length > 0) {
      e.preventDefault();
      const next = (activeIndex + 1) % flatOptions.length;
      setActiveIndex(next);
      scrollActiveOptionIntoView(next);
      return;
    }
    if (e.key === 'ArrowUp' && flatOptions.length > 0) {
      e.preventDefault();
      const next = (activeIndex - 1 + flatOptions.length) % flatOptions.length;
      setActiveIndex(next);
      scrollActiveOptionIntoView(next);
      return;
    }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing && flatOptions.length > 0) {
      e.preventDefault();
      const target = flatOptions[activeIndex] ?? flatOptions[0];
      if (target) {
        selectValue(target.value);
      }
    }
  }

  let runningIndex = 0;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-1.5"
      onBlur={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          closePanel(false);
        }
      }}
    >
      <label htmlFor={triggerId} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        data-testid={triggerTestId}
        onClick={() => (isOpen ? closePanel(false) : openPanel())}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openPanel();
          }
        }}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control border border-border bg-surface px-3 py-2 text-left text-base text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedOption ? 'truncate font-medium text-ink' : 'truncate text-ink-muted'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 left-0 top-full z-30 mt-1 flex flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated shadow-xl">
          <div className="border-b border-border bg-surface p-2">
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-testid={searchTestId}
              className="min-h-10 w-full rounded-control border border-border bg-surface-subtle px-3 py-1.5 text-sm text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>

          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={label}
            className="max-h-72 overflow-y-auto p-1"
          >
            {filteredGroups.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-ink-muted">{emptyMessage}</p>
            ) : (
              filteredGroups.map((group) => {
                const groupHeadingId = `${listboxId}-group-${group.id}`;
                return (
                  <div key={group.id} role="group" aria-labelledby={groupHeadingId} className="mb-1 last:mb-0">
                    <div
                      id={groupHeadingId}
                      className="px-2.5 py-1 text-xs font-semibold tracking-wide text-ink-muted uppercase"
                    >
                      {group.label}
                    </div>
                    {group.options.map((opt) => {
                      const currentIdx = runningIndex;
                      runningIndex += 1;
                      const isSelected = opt.value === value;
                      const isActive = currentIdx === activeIndex;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          data-option-idx={currentIdx}
                          data-testid={optionTestId?.(opt.value)}
                          onMouseDown={(e) => e.preventDefault()}
                          onMouseEnter={() => setActiveIndex(currentIdx)}
                          onClick={() => selectValue(opt.value)}
                          className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-left text-sm ${
                            isSelected
                              ? 'bg-highlight font-semibold text-highlight-fg'
                              : isActive
                                ? 'bg-surface-subtle text-ink'
                                : 'text-ink hover:bg-surface-subtle'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {opt.meta ? (
                            <span className="shrink-0 text-xs text-ink-muted">{opt.meta}</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
