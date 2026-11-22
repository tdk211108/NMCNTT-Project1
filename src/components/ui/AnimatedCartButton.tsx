'use client';

import { Check } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { CartPlusIcon } from '@/components/ui/Icons';

export interface AnimatedCartButtonProps {
  ariaLabel: string;
  title?: string;
  size?: 'card' | 'detail';
  variant?: 'outline' | 'primary';
  className?: string;
  testId?: string;
  onAdd: () => void;
}

/**
 * Lightswind-inspired physical 3D chip-drop cart button preserving 44x44px touch targets
 * and non-blocking rapid clicks.
 */
export function AnimatedCartButton({
  ariaLabel,
  title,
  size = 'card',
  variant = 'outline',
  className = '',
  testId,
  onAdd,
}: AnimatedCartButtonProps) {
  const [phase, setPhase] = useState<'idle' | 'dropping' | 'added'>('idle');
  const [dropSeq, setDropSeq] = useState(0);
  const dropTimerRef = useRef<number | null>(null);
  const resetTimerRef = useRef<number | null>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    return () => {
      if (dropTimerRef.current !== null) window.clearTimeout(dropTimerRef.current);
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  function clearTimers() {
    if (dropTimerRef.current !== null) window.clearTimeout(dropTimerRef.current);
    if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
  }

  function handleClick() {
    onAdd();
    clearTimers();
    setDropSeq((prev) => prev + 1);

    if (prefersReduced) {
      setPhase('added');
      resetTimerRef.current = window.setTimeout(() => {
        setPhase('idle');
      }, 900);
      return;
    }

    setPhase('dropping');

    dropTimerRef.current = window.setTimeout(() => {
      setPhase('added');
    }, 340);

    resetTimerRef.current = window.setTimeout(() => {
      setPhase('idle');
    }, 1050);
  }

  const sizeClass = size === 'detail' ? 'h-12 w-12' : 'h-11 w-11';
  const baseTone =
    variant === 'primary'
      ? 'bg-primary text-primary-fg border-border-strong hover:bg-[var(--color-primary-hover)]'
      : 'bg-surface text-ink border-border-strong hover:border-signal hover:text-accent-ink';

  return (
    <motion.button
      type="button"
      data-sfx="success"
      aria-label={ariaLabel}
      title={title}
      data-testid={testId}
      data-added={phase !== 'idle' ? 'true' : 'false'}
      whileTap={{ scale: 0.91 }}
      onClick={handleClick}
      className={`mtx-shadow-sm relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-control border-2 p-0 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${sizeClass} ${
        phase === 'added' ? 'border-success bg-highlight text-highlight-fg' : baseTone
      } ${className}`}
    >
      {phase === 'dropping' ? (
        <motion.span
          key={`drop-${dropSeq}`}
          aria-hidden="true"
          initial={{ y: -18, scale: 1.05, rotate: -18, opacity: 1 }}
          animate={{ y: 2, scale: 0.35, rotate: 12, opacity: 0.1 }}
          transition={{ duration: 0.34, ease: [0.32, 0, 0.67, 0] }}
          className="pointer-events-none absolute top-1/2 left-1/2 z-20 h-2.5 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-primary-fg bg-primary"
        />
      ) : null}

      <span className="relative z-10 inline-flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'added' ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, scale: 0.5, rotate: -25 }}
              animate={{ opacity: 1, scale: 1.05, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.65 }}
              transition={{ type: 'spring', stiffness: 460, damping: 20 }}
              className="inline-flex items-center justify-center"
            >
              <Check className={size === 'detail' ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
            </motion.span>
          ) : (
            <motion.span
              key={`cart-${dropSeq}`}
              animate={
                phase === 'dropping'
                  ? {
                      rotate: [0, -14, 8, 0],
                      y: [0, 3, -1, 0],
                      scale: [1, 1.15, 0.95, 1],
                    }
                  : { rotate: 0, y: 0, scale: 1 }
              }
              transition={{ duration: 0.36, ease: 'easeOut' }}
              className="inline-flex items-center justify-center"
            >
              <CartPlusIcon className={size === 'detail' ? 'h-5 w-5' : 'h-4 w-4'} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
}
