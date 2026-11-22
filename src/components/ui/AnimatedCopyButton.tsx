'use client';

import { Check, Copy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';

function copyWithLegacyFallback(text: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
  return ok;
}

export interface AnimatedCopyButtonProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
  testId?: string;
  onCopied?: () => void;
}

export function AnimatedCopyButton({
  textToCopy,
  label,
  copiedLabel = VI_MESSAGES.common.copiedAction,
  ariaLabel = VI_MESSAGES.common.copyAction,
  size = 'sm',
  className = '',
  testId,
  onCopied,
}: AnimatedCopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    try {
      let copied = false;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        copied = true;
      } else {
        copied = copyWithLegacyFallback(textToCopy);
      }
      if (!copied) return;
      setIsCopied(true);
      onCopied?.();
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setIsCopied(false);
        timerRef.current = null;
      }, 2000);
    } catch {
      if (copyWithLegacyFallback(textToCopy)) {
        setIsCopied(true);
        onCopied?.();
      }
    }
  }

  const paddingClasses = label
    ? size === 'md'
      ? 'min-h-11 px-3.5 text-sm'
      : 'min-h-9 px-3 text-xs'
    : size === 'md'
      ? 'h-10 w-10 p-0'
      : 'h-9 w-9 p-0';

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy();
      }}
      data-testid={testId}
      data-copied={isCopied ? 'true' : 'false'}
      aria-label={label ? undefined : isCopied ? copiedLabel : ariaLabel}
      className={`mtx-shadow-sm relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 overflow-hidden rounded-control border-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
        isCopied
          ? 'border-success bg-highlight text-highlight-fg'
          : 'border-border-strong bg-surface-elevated text-ink hover:border-signal hover:text-accent-ink'
      } ${paddingClasses} ${className}`}
    >
      <span className="relative z-10 flex h-4 w-4 shrink-0 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isCopied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.55, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.55, rotate: 20 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="inline-flex items-center justify-center"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="inline-flex items-center justify-center"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {label ? <span className="relative z-10">{isCopied ? copiedLabel : label}</span> : null}

      {isCopied && !prefersReduced ? (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-0 rounded-control bg-success/20"
        />
      ) : null}
    </button>
  );
}
