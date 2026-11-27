'use client';

import {
  useEffect,
  useLayoutEffect,
  useSyncExternalStore,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener('change', onStoreChange);
  return () => mql.removeEventListener('change', onStoreChange);
}

/** Reads `prefers-reduced-motion: reduce` imperatively for animations and effects. */
export function prefersReducedMotionNow(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/** Subscribes reactively to `prefers-reduced-motion: reduce` media query changes. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotionNow,
    () => false,
  );
}

const subscribeNoop = () => () => {};

/** Hydration-safe check that returns `false` on SSR and `true` on client render. */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

/** Synchronizes a native `<dialog>` element's top-layer modal state with a boolean `open` prop. */
export function useNativeDialog(
  dialogRef: RefObject<HTMLDialogElement | null>,
  open: boolean,
): void {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [dialogRef, open]);
}

/** Fallback click-outside detector for browsers lacking `<dialog closedby="any">`. */
export function isOutsideDialogBackdropClick(
  event: ReactMouseEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement | null,
): boolean {
  if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) {
    return false;
  }
  if (!dialog || event.target !== dialog || event.detail === 0) {
    return false;
  }
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}

/** Submits the enclosing form on Enter while ignoring IME composition and nested non-submit buttons. */
export function submitFormOnEnterExcludingButtons(
  event: ReactKeyboardEvent<HTMLFormElement>,
  isBusy: boolean,
): void {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing || isBusy) {
    return;
  }
  const target = event.target as HTMLElement | null;
  if (target?.closest('button[type="button"]')) {
    return;
  }
  event.preventDefault();
  event.currentTarget.requestSubmit();
}
