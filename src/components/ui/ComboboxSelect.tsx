'use client';

import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';

export interface ComboboxSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface ComboboxSelectProps<T extends string = string> {
  label?: string;
  value: T;
  options: readonly ComboboxSelectOption<T>[];
  disabled?: boolean;
  testId?: string;
  onChange: (value: T) => void;
}

/**
 * Animated Base UI selector replacing plain dropdowns like catalog sorting
 * with Animate UI enter/exit transitions, check indicator motion, and preserved testids.
 */
export function ComboboxSelect<T extends string = string>({
  label,
  value,
  options,
  disabled = false,
  testId,
  onChange,
}: ComboboxSelectProps<T>) {
  const triggerId = useId();
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const activeOption = options.find((opt) => opt.value === value) ?? options[0];

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={triggerId} className="text-sm font-medium text-ink">
          {label}
        </label>
      ) : null}

      <BaseSelect.Root<T>
        value={value}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onChange(nextValue);
          }
        }}
      >
        <BaseSelect.Trigger
          id={triggerId}
          aria-label={label}
          data-testid={testId}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-control border-2 border-border-strong bg-surface px-3 py-2 text-left text-sm font-medium text-ink transition-colors hover:border-signal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{activeOption?.label ?? ''}</span>
          <BaseSelect.Icon>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-ink-muted motion-safe:transition-transform ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner side="bottom" sideOffset={6} align="start" className="z-50 w-[var(--anchor-width)]">
            <BaseSelect.Popup className="mtx-shadow origin-[var(--transform-origin)] overflow-hidden rounded-card border-2 border-border-strong bg-surface-elevated p-1 text-ink outline-none transition-[transform,opacity] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] data-[starting-style]:-translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 data-[ending-style]:-translate-y-1 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 motion-reduce:transition-none">
              <BaseSelect.List>
                {options.map((option) => (
                  <BaseSelect.Item
                    key={option.value}
                    value={option.value}
                    className="flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-surface-subtle data-[selected]:bg-highlight data-[selected]:font-semibold data-[selected]:text-highlight-fg"
                  >
                    <BaseSelect.ItemText>{option.label}</BaseSelect.ItemText>
                    <BaseSelect.ItemIndicator>
                      <motion.span
                        initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 22 }}
                        className="inline-flex items-center"
                      >
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </motion.span>
                    </BaseSelect.ItemIndicator>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
}
