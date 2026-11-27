'use client';

import { useCallback, useEffect, useRef, type ChangeEvent, type Ref } from 'react';
import { formatCommaNumberInput } from '@/lib/format';
import { Input, type InputProps } from './Input';

export interface PriceInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
  value: string;
  onValueChange: (formattedValue: string) => void;
}

function mergeRefs<T>(localRef: { current: T | null }, externalRef?: Ref<T>) {
  return (node: T | null) => {
    localRef.current = node;
    if (typeof externalRef === 'function') {
      externalRef(node);
    } else if (externalRef && typeof externalRef === 'object') {
      externalRef.current = node;
    }
  };
}

/**
 * Text input that formats integer VND amounts with commas while preserving cursor placement.
 */
export function PriceInput({
  value,
  onValueChange,
  onChange,
  ref,
  inputMode = 'numeric',
  autoComplete = 'off',
  ...rest
}: PriceInputProps & { onChange?: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const innerRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const el = event.currentTarget;
      const selectionStart = el.selectionStart;
      const digitsBeforeCaret =
        selectionStart !== null
          ? el.value.slice(0, selectionStart).replace(/\D/g, '').length
          : null;

      const formatted = formatCommaNumberInput(el.value);
      onValueChange(formatted);
      onChange?.(event);

      if (digitsBeforeCaret !== null && typeof window !== 'undefined') {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = window.requestAnimationFrame(() => {
          rafRef.current = null;
          const currentEl = innerRef.current;
          if (!currentEl || document.activeElement !== currentEl) return;
          let nextCaret = 0;
          if (digitsBeforeCaret > 0) {
            let digitsSeen = 0;
            nextCaret = formatted.length;
            for (let i = 0; i < formatted.length; i += 1) {
              if (/\d/.test(formatted[i])) {
                digitsSeen += 1;
                if (digitsSeen === digitsBeforeCaret) {
                  nextCaret = i + 1;
                  break;
                }
              }
            }
          }
          currentEl.setSelectionRange(nextCaret, nextCaret);
        });
      }
    },
    [onChange, onValueChange],
  );

  return (
    <Input
      ref={mergeRefs(innerRef, ref)}
      type="text"
      inputMode={inputMode}
      autoComplete={autoComplete}
      value={value}
      onChange={handleChange}
      {...rest}
    />
  );
}
