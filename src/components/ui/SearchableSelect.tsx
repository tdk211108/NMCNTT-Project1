'use client';

import { Combobox } from '@base-ui/react/combobox';
import { Check, ChevronDown, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
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

interface InternalOption extends SearchableSelectOption {
  groupLabel: string;
}

/**
 * Animate UI / Base UI Combobox powering grouped searchable selectors across Compare & PSU.
 */
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { allOptions, selectedOption } = useMemo(() => {
    const flat: InternalOption[] = [];
    let matched: InternalOption | null = null;
    for (const group of groups) {
      for (const opt of group.options) {
        const entry: InternalOption = { ...opt, groupLabel: group.label };
        flat.push(entry);
        if (opt.value === value) {
          matched = entry;
        }
      }
    }
    return { allOptions: flat, selectedOption: matched };
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

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={triggerId} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-danger">
            *
          </span>
        ) : null}
      </label>

      <Combobox.Root<InternalOption>
        items={allOptions}
        value={selectedOption}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery('');
          }
        }}
        inputValue={query}
        onInputValueChange={(nextInput) => setQuery(nextInput)}
        onValueChange={(nextOption) => {
          if (nextOption) {
            onChange(nextOption.value);
          }
        }}
        isItemEqualToValue={(item, current) => item.value === current.value}
        itemToStringLabel={(item) => item.label}
        itemToStringValue={(item) => item.value}
        filter={null}
        disabled={disabled}
      >
        <Combobox.Trigger
          id={triggerId}
          data-testid={triggerTestId}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-control border-2 border-border-strong bg-surface px-3 py-2 text-left text-base text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selectedOption ? 'truncate font-medium text-ink' : 'truncate text-ink-muted'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 text-ink-muted motion-safe:transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Positioner side="bottom" sideOffset={6} align="start" className="z-50 w-[var(--anchor-width)]">
            <Combobox.Popup className="mtx-shadow overflow-hidden rounded-card border-2 border-border-strong bg-surface-elevated text-ink outline-none">
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-2 border-b border-border bg-surface p-2">
                  <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <Combobox.Input
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-testid={searchTestId}
                    className="min-h-9 w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
                  />
                </div>

                <Combobox.List className="max-h-72 overflow-y-auto p-1">
                  {filteredGroups.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-ink-muted">{emptyMessage}</p>
                  ) : (
                    filteredGroups.map((group) => (
                      <Combobox.Group key={group.id} className="mb-1 last:mb-0">
                        <Combobox.GroupLabel className="px-2.5 py-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                          {group.label}
                        </Combobox.GroupLabel>
                        {group.options.map((opt) => {
                          const itemObj: InternalOption = { ...opt, groupLabel: group.label };
                          const isSelected = opt.value === value;
                          return (
                            <Combobox.Item
                              key={opt.value}
                              value={itemObj}
                              data-testid={optionTestId?.(opt.value)}
                              className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-left text-sm outline-none data-[highlighted]:bg-surface-subtle ${
                                isSelected
                                  ? 'bg-highlight font-semibold text-highlight-fg'
                                  : 'text-ink'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <Check
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    isSelected ? 'opacity-100' : 'opacity-0'
                                  }`}
                                  aria-hidden="true"
                                />
                                <span className="truncate">{opt.label}</span>
                              </span>
                              {opt.meta ? (
                                <span className="shrink-0 font-mono text-xs tabular-nums text-ink-muted">
                                  {opt.meta}
                                </span>
                              ) : null}
                            </Combobox.Item>
                          );
                        })}
                      </Combobox.Group>
                    ))
                  )}
                </Combobox.List>
              </motion.div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
