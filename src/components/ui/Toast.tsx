'use client';

import { VI_MESSAGES } from '@/shared/messages/vi';
import { SolarIcon, type SolarIconName } from './Icons';
import { useToastStore, type ToastTone } from './toast-store';

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'aero-glass-elevated border-border-strong text-ink',
  success: 'aero-glass-elevated border-success/55 text-highlight-fg',
  warning: 'aero-glass-elevated border-warning/55 text-warning',
  error: 'aero-glass-elevated border-danger/60 text-danger',
};

const TONE_ICONS: Record<ToastTone, SolarIconName> = {
  info: 'info-circle-bold-duotone',
  success: 'check-circle-bold-duotone',
  warning: 'danger-triangle-bold-duotone',
  error: 'close-circle-bold-duotone',
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
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-card px-4 py-3 text-sm ${TONE_CLASSES[toast.tone]}`}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <SolarIcon name={TONE_ICONS[toast.tone]} className="h-5 w-5" />
            <p className="leading-snug font-medium text-ink">{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={VI_MESSAGES.common.close}
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-subtle hover:text-ink"
          >
            <SolarIcon name="close-circle-bold-duotone" className="h-4 w-4" withShadow={false} />
          </button>
        </div>
      ))}
    </div>
  );
}
