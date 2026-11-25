'use client';

import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface AlertDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isConfirming?: boolean;
  dismissible?: boolean;
  testId?: string;
  confirmTestId?: string;
  cancelTestId?: string;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Native top-layer confirmation dialog wrapping `Modal` with alert iconography and spring motion.
 * Defaults keyboard focus onto the safe cancel trigger on open.
 */
export function AlertDialog({
  open,
  title,
  description,
  confirmLabel = VI_MESSAGES.common.confirm,
  cancelLabel = VI_MESSAGES.common.cancel,
  variant = 'danger',
  isConfirming = false,
  dismissible = true,
  testId,
  confirmTestId,
  cancelTestId,
  children,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const descId = useId();

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      dismissible={dismissible}
      testId={testId}
      dialogClassName="max-w-md"
      ariaDescribedBy={descId}
      titlePrefix={
        <span
          className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control border-2 border-border-strong ${
            variant === 'danger'
              ? 'bg-danger/15 text-danger'
              : 'bg-primary/15 text-accent-ink'
          }`}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
      }
      subtitle={
        <p id={descId} className="text-sm text-ink-muted">
          {description}
        </p>
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4"
      >
        {children}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            autoFocus
            disabled={isConfirming}
            data-testid={cancelTestId}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant}
            isLoading={isConfirming}
            data-testid={confirmTestId}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </motion.div>
    </Modal>
  );
}
