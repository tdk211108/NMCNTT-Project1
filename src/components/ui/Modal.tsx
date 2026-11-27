'use client';

import { X } from 'lucide-react';
import { useId, useRef, type ReactNode } from 'react';
import { useNativeDialog } from '@/lib/client-hooks';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  testId?: string;
  dialogClassName?: string;
  ariaDescribedBy?: string;
  titlePrefix?: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
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
  ariaDescribedBy,
  titlePrefix,
  subtitle,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useNativeDialog(dialogRef, open);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
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
      className={`mtx-shadow-accent m-auto max-h-[92dvh] w-[calc(100%-1rem)] overflow-y-auto overscroll-contain rounded-modal border-2 border-border-strong bg-surface p-4 text-ink sm:w-[calc(100%-2rem)] sm:p-5 ${dialogClassName}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3 border-b-2 border-border pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          {titlePrefix}
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id={titleId} className="font-display text-base font-bold tracking-wide text-ink sm:text-lg">
              {title}
            </h2>
            {subtitle}
          </div>
        </div>
        {dismissible && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={VI_MESSAGES.common.close}
            className="inline-flex min-h-10 min-w-10 shrink-0 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface-subtle px-2 text-sm text-ink-muted hover:border-signal hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
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
