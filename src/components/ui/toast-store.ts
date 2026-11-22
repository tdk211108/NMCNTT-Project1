'use client';

import { createElement } from 'react';
import toast from 'react-hot-toast';
import { ToastItemCard, type ToastTone } from './Toast';

export type { ToastTone };

const DEFAULT_TOAST_DURATION_MS = 4500;

/** Dispatches a Neo-Brutalist toast notification through react-hot-toast. */
export function showToast(message: string, tone: ToastTone = 'info'): void {
  toast.custom(
    (item) => createElement(ToastItemCard, { toast: item, message, tone }),
    { duration: DEFAULT_TOAST_DURATION_MS },
  );
}
