'use client';

import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: string) => void;
}

let nextToastSeq = 1;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push(message, tone = 'info') {
    const id = `toast-${nextToastSeq++}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, tone }],
    }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 4500);
    }
  },
  dismiss(id) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export function showToast(message: string, tone: ToastTone = 'info'): void {
  useToastStore.getState().push(message, tone);
}
