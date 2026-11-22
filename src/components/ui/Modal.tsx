'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  testId?: string;
  dialogClassName?: string;
  children: ReactNode;
}

/**
 * Native `<dialog>` modal following modern top-layer accessibility rules:
 * `showModal()` manages focus containment, Esc dismissal, and inert backdrop natively.
 */
export function Modal({
  open,
  title,
  onClose,
  dismissible = true,
  testId,
  dialogClassName = 'max-w-lg',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
      data-testid={testId}
      onCancel={(event) => {
        if (!dismissible) {
          event.preventDefault();
          return;
        }
        onClose?.();
      }}
      onClose={() => {
        if (dismissible) {
          onClose?.();
        }
      }}
      onClick={(event) => {
        if (!dismissible) return;
        const dialog = dialogRef.current;
        if (!dialog || event.target !== dialog || event.detail === 0) return;
        const rect = dialog.getBoundingClientRect();
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom;
        if (outside) {
          onClose?.();
        }
      }}
      className={`mtx-shadow-accent m-auto w-[calc(100%-2rem)] rounded-modal border-2 border-border-strong bg-surface p-5 text-ink ${dialogClassName}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-border pb-3">
        <h2 id={titleId} className="font-display text-lg font-bold tracking-wide text-ink">
          {title}
        </h2>
        {dismissible && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={VI_MESSAGES.common.close}
            className="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-subtle px-2 text-sm text-ink-muted hover:border-signal hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{VI_MESSAGES.common.close}</span>
          </button>
        ) : null}
      </div>
      <div>{children}</div>
    </dialog>
  );
}
