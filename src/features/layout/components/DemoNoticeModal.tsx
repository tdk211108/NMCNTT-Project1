'use client';

import { ShieldAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Button } from '@/components/ui/Button';
import { safeLocalStorage } from '@/lib/safe-storage';
import {
  DEMO_NOTICE_DURATION_MS,
  DEMO_NOTICE_SECONDS,
  DEMO_NOTICE_STORAGE_KEY,
} from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { usePreloaderDismissed } from './SitePreloader';

interface StorageReader {
  getItem: (key: string) => string | null;
}

interface StorageWriter {
  setItem: (key: string, value: string) => void;
}

/** Returns true when the visitor has not yet seen the first-visit academic notice. */
export function shouldShowDemoNotice(storage: StorageReader = safeLocalStorage): boolean {
  return storage.getItem(DEMO_NOTICE_STORAGE_KEY) !== '1';
}

/** Persists that the first-visit academic notice has been displayed. */
export function markDemoNoticeSeen(storage: StorageWriter = safeLocalStorage): void {
  storage.setItem(DEMO_NOTICE_STORAGE_KEY, '1');
}

/** Converts remaining milliseconds into whole visible countdown seconds (`1..5`, `0` at end). */
export function computeDemoNoticeSeconds(remainingMs: number): number {
  return Math.max(0, Math.min(DEMO_NOTICE_SECONDS, Math.ceil(remainingMs / 1000)));
}

/** Converts remaining milliseconds into remaining bar width percentage (`0..100`). */
export function computeDemoNoticeProgress(remainingMs: number): number {
  return Math.max(0, Math.min(100, (remainingMs / DEMO_NOTICE_DURATION_MS) * 100));
}

export interface DemoNoticeDialogViewProps {
  dialogRef?: RefObject<HTMLDialogElement | null>;
  canClose: boolean;
  remainingSeconds: number;
  progressPercent: number;
  onClose?: () => void;
  onBlockedClose?: () => void;
}

/** Presentational native top-layer `<dialog>` displaying the bilingual academic disclaimer. */
export function DemoNoticeDialogView({
  dialogRef,
  canClose,
  remainingSeconds,
  progressPercent,
  onClose,
  onBlockedClose,
}: DemoNoticeDialogViewProps) {
  const titleId = useId();
  const descId = useId();
  const copy = VI_MESSAGES.demoNotice;

  return (
    <dialog
      ref={dialogRef}
      closedby={canClose ? 'closerequest' : 'none'}
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-testid={TEST_IDS.layout.demoNoticeDialog}
      onCancel={(event) => {
        if (!canClose) {
          event.preventDefault();
        }
      }}
      onClose={() => {
        if (canClose) {
          onClose?.();
          return;
        }
        onBlockedClose?.();
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-lg overflow-visible border-0 bg-transparent p-0 text-ink focus:outline-none"
    >
      <div className="mtx-shadow-accent flex flex-col gap-4 rounded-modal border-2 border-border-strong bg-surface p-4 sm:p-5">
        <div className="flex items-start gap-3 border-b-2 border-border pb-3">
          <span
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-control border-2 border-demo-border bg-demo-bg text-demo-fg"
            aria-hidden="true"
          >
            <ShieldAlert className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-accent-ink">
              <span>{copy.badgeVi}</span>
              <span aria-hidden="true"> / </span>
              <span lang="en">{copy.badgeEn}</span>
            </p>
            <h1
              id={titleId}
              className="text-base font-bold leading-snug text-ink sm:text-lg"
            >
              {copy.titleVi}
              <span
                lang="en"
                className="mt-0.5 block text-xs font-semibold tracking-wide text-ink-muted sm:text-sm"
              >
                {copy.titleEn}
              </span>
            </h1>
          </div>
        </div>

        <div id={descId} className="space-y-3 text-sm leading-relaxed">
          <p className="rounded-control border-2 border-demo-border bg-demo-bg px-3 py-2.5 font-medium text-demo-fg">
            {copy.bodyVi}
          </p>
          <p
            lang="en"
            className="rounded-control border-2 border-border bg-surface-subtle px-3 py-2.5 text-ink"
          >
            {copy.bodyEn}
          </p>
        </div>

        <div className="space-y-3 border-t-2 border-border pt-3">
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-control border border-border-strong bg-surface-subtle">
              <div
                className="h-full bg-primary transition-[width] duration-100 ease-linear motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p
              data-testid={TEST_IDS.layout.demoNoticeCountdown}
              className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs font-semibold tabular-nums text-ink-muted"
            >
              {canClose ? (
                <>
                  <span>{copy.unlockedVi}</span>
                  <span lang="en">{copy.unlockedEn}</span>
                </>
              ) : (
                <>
                  <span>{copy.unlockingVi(remainingSeconds)}</span>
                  <span lang="en">{copy.unlockingEn(remainingSeconds)}</span>
                </>
              )}
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={!canClose}
            data-testid={TEST_IDS.layout.demoNoticeClose}
            onClick={onClose}
          >
            {canClose ? (
              <>
                <span>{copy.closeButtonVi}</span>
                <span aria-hidden="true">/</span>
                <span lang="en">{copy.closeButtonEn}</span>
              </>
            ) : (
              <>
                <span>{copy.closeButtonLockedVi(remainingSeconds)}</span>
                <span aria-hidden="true">/</span>
                <span lang="en">{copy.closeButtonLockedEn(remainingSeconds)}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * First-visit bilingual warning dialog displayed after the preloader overlay finishes dismissing.
 * Locks dismissal for 5 seconds, then enables the explicit close button without auto-closing.
 */
export function DemoNoticeModal() {
  const preloaderDismissed = usePreloaderDismissed();
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [remainingMs, setRemainingMs] = useState(DEMO_NOTICE_DURATION_MS);

  const dialogRef = useRef<HTMLDialogElement>(null);
  // Tracks unlocked state synchronously for native `<dialog>` close guards.
  const canCloseRef = useRef(false);

  useEffect(() => {
    if (!preloaderDismissed || !shouldShowDemoNotice(safeLocalStorage)) return;

    const frameId = window.requestAnimationFrame(() => {
      canCloseRef.current = false;
      setCanClose(false);
      setRemainingMs(DEMO_NOTICE_DURATION_MS);
      setIsOpen(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [preloaderDismissed]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    canCloseRef.current = false;
    markDemoNoticeSeen(safeLocalStorage);

    if (!dialog.open) {
      dialog.showModal();
    }

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      const nextRemaining = Math.max(0, DEMO_NOTICE_DURATION_MS - (Date.now() - startedAt));
      setRemainingMs(nextRemaining);
    }, 100);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
      canCloseRef.current = true;
      setRemainingMs(0);
      setCanClose(true);
    }, DEMO_NOTICE_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  function handleClose() {
    if (!canCloseRef.current) return;
    markDemoNoticeSeen(safeLocalStorage);
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    }
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <DemoNoticeDialogView
      dialogRef={dialogRef}
      canClose={canClose}
      remainingSeconds={computeDemoNoticeSeconds(remainingMs)}
      progressPercent={computeDemoNoticeProgress(remainingMs)}
      onClose={handleClose}
      onBlockedClose={() => {
        if (canCloseRef.current) return;
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) {
          try {
            dialog.showModal();
          } catch {
            // Ignore if the dialog is already disconnected during unmount.
          }
        }
      }}
    />
  );
}
