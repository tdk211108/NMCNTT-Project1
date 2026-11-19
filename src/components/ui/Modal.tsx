'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  testId?: string;
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
        if (!dialog) return;
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
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-modal border border-border-strong bg-surface p-5 text-ink shadow-xl"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {dismissible && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={VI_MESSAGES.common.close}
            className="min-h-9 min-w-9 rounded-control border border-border px-2 text-sm text-ink-muted hover:text-ink"
          >
            {VI_MESSAGES.common.close}
          </button>
        ) : null}
      </div>
      <div>{children}</div>
    </dialog>
  );
}
