'use client';

import { VI_MESSAGES } from '@/shared/messages/vi';
import { useToastStore, type ToastTone } from './toast-store';

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'border-border-strong bg-surface-elevated text-ink',
  success: 'border-success/60 bg-highlight text-highlight-fg',
  warning: 'border-warning/60 bg-surface-elevated text-warning',
  error: 'border-danger/60 bg-danger text-danger-fg',
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
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-control border px-3 py-2.5 text-sm shadow-lg ${TONE_CLASSES[toast.tone]}`}
        >
          <p className="leading-snug">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={VI_MESSAGES.common.close}
            className="shrink-0 rounded px-1.5 py-0.5 text-xs opacity-80 hover:opacity-100"
          >
            {VI_MESSAGES.common.close}
          </button>
        </div>
      ))}
    </div>
  );
}
