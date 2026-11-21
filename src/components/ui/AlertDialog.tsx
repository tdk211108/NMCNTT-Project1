'use client';

import { AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isConfirming?: boolean;
  dismissible?: boolean;
  testId?: string;
  confirmTestId?: string;
  cancelTestId?: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native top-layer confirmation dialog (`<dialog showModal()>`) with spring motion.
 * Defaults keyboard focus onto the safe cancel trigger on open.
 */
export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = VI_MESSAGES.common.confirm,
  cancelLabel = VI_MESSAGES.common.cancel,
  variant = 'danger',
  isConfirming = false,
  dismissible = true,
  testId,
  confirmTestId,
  cancelTestId,
  children,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid={testId}
      onCancel={(event) => {
        if (!dismissible) {
          event.preventDefault();
          return;
        }
        onCancel();
      }}
      onClose={() => {
        if (dismissible) {
          onCancel();
        }
      }}
      onClick={(event) => {
        if (!dismissible) return;
        const dialog = dialogRef.current;
        if (!dialog) return;
        const rect = dialog.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (outside) {
          onCancel();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-visible border-0 bg-transparent p-0 text-ink backdrop:bg-black/70"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="mtx-shadow-accent flex flex-col gap-4 rounded-modal border-2 border-border-strong bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-3 border-b-2 border-border pb-3">
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border-2 border-border-strong ${
                variant === 'danger'
                  ? 'bg-danger/15 text-danger'
                  : 'bg-primary/15 text-accent-ink'
              }`}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 id={titleId} className="font-display text-lg font-bold tracking-wide text-ink">
                {title}
              </h2>
              <p id={descId} className="text-sm text-ink-muted">
                {description}
              </p>
            </div>
          </div>

          {dismissible ? (
            <button
              type="button"
              onClick={onCancel}
              aria-label={VI_MESSAGES.common.close}
              className="inline-flex min-h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-subtle text-ink-muted hover:border-signal hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {children}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            autoFocus
            disabled={isConfirming}
            data-testid={cancelTestId}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            isLoading={isConfirming}
            data-testid={confirmTestId}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </dialog>
  );
}
