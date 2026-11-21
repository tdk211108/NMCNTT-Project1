'use client';

import { X } from 'lucide-react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { useToastStore, type ToastTone } from './toast-store';

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'border-border-strong bg-surface-elevated text-ink',
  success: 'border-success bg-highlight text-highlight-fg',
  warning: 'border-warning bg-surface-elevated text-warning',
  error: 'border-danger bg-danger text-danger-fg',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      role="region"
      aria-label="Thông báo"
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`mtx-shadow-sm pointer-events-auto flex items-start justify-between gap-3 rounded-control border-2 px-3 py-2.5 text-sm ${TONE_CLASSES[toast.tone]}`}
        >
          <p className="leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={VI_MESSAGES.common.close}
            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center border border-current opacity-85 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">{VI_MESSAGES.common.close}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
