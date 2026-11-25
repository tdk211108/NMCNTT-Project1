'use client';

import { AlertTriangle, Info, X } from 'lucide-react';
import toast, {
  CheckmarkIcon,
  ErrorIcon,
  Toaster,
  type Toast as HotToast,
} from 'react-hot-toast';
import { VI_MESSAGES } from '@/shared/messages/vi';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

const TONE_CLASSES: Record<ToastTone, string> = {
  info: 'border-border-strong bg-surface-elevated text-ink',
  success: 'border-success bg-highlight text-highlight-fg',
  warning: 'border-warning bg-surface-elevated text-warning',
  error: 'border-danger bg-danger text-danger-fg',
};

function ToastToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') {
    return (
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <CheckmarkIcon
          primary="var(--color-success)"
          secondary="var(--color-success-fg)"
        />
      </span>
    );
  }
  if (tone === 'error') {
    return (
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <ErrorIcon
          primary="var(--color-danger-fg)"
          secondary="var(--color-danger)"
        />
      </span>
    );
  }
  if (tone === 'warning') {
    return <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />;
  }
  return <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent-ink" aria-hidden="true" />;
}

export interface ToastItemCardProps {
  toast: HotToast;
  message: string;
  tone: ToastTone;
}

/** Custom Neo-Brutalist notification card powered by react-hot-toast lifecycle & animations. */
export function ToastItemCard({ toast: item, message, tone }: ToastItemCardProps) {
  return (
    <div
      role="status"
      data-toast-tone={tone}
      className={`mtx-shadow-sm pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-control border-2 px-3 py-2.5 text-sm ${TONE_CLASSES[tone]} ${
        item.visible ? 'mtx-toast-enter' : 'mtx-toast-exit'
      }`}
    >
      <ToastToneIcon tone={tone} />
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <button
        type="button"
        data-no-grid-cascade=""
        onClick={() => toast.dismiss(item.id)}
        aria-label={VI_MESSAGES.common.close}
        className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-control border border-current opacity-85 transition-opacity hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">{VI_MESSAGES.common.close}</span>
      </button>
    </div>
  );
}

/** Global top-right toast host managed by react-hot-toast. */
export function ToastContainer() {
  return (
    <div role="region" aria-label={VI_MESSAGES.common.notificationsAria} aria-live="polite">
      <Toaster
        position="top-right"
        gutter={10}
        containerStyle={{ top: 16, right: 16, zIndex: 50 }}
      />
    </div>
  );
}
