'use client';

import type { ReactNode } from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { AnimatePresence, MotionConfig, motion, type HTMLMotionProps } from 'motion/react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import {
  DEFAULT_DIALOG_SPRING,
  DIALOG_BACKDROP_CLASS,
  DIALOG_BACKDROP_MOTION,
  DIALOG_POPUP_CLASS,
  DIALOG_VIEWPORT_CLASS,
  getDialogSlideOffset,
} from './AlertDialog';
import { SolarIcon } from './Icons';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose?: () => void;
  dismissible?: boolean;
  testId?: string;
  children: ReactNode;
}

/**
 * Accessible Aero Glass dialog built on Base UI Dialog + Motion spring transitions.
 */
export function Modal({
  open,
  title,
  onClose,
  dismissible = true,
  testId,
  children,
}: ModalProps) {
  const offset = getDialogSlideOffset('top');

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: DialogPrimitive.Root.ChangeEventDetails,
  ) {
    if (!nextOpen && !dismissible) {
      eventDetails.cancel();
      return;
    }
    if (!nextOpen) {
      onClose?.();
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <DialogPrimitive.Root
        open={open}
        disablePointerDismissal={!dismissible}
        onOpenChange={handleOpenChange}
      >
        <AnimatePresence>
          {open ? (
            <DialogPrimitive.Portal key="dialog-portal" keepMounted>
              <DialogPrimitive.Backdrop
                forceRender
                render={(renderProps) => {
                  const { hidden: _hidden, ...domProps } = renderProps;
                  void _hidden;
                  return (
                    <motion.div
                      {...(domProps as HTMLMotionProps<'div'>)}
                      {...DIALOG_BACKDROP_MOTION}
                      className={DIALOG_BACKDROP_CLASS}
                    />
                  );
                }}
              />
              <DialogPrimitive.Viewport className={DIALOG_VIEWPORT_CLASS}>
                <DialogPrimitive.Popup
                  data-testid={testId}
                  render={(renderProps) => {
                    const { hidden: _hidden, ...domProps } = renderProps;
                    void _hidden;
                    return (
                      <motion.div
                        {...(domProps as HTMLMotionProps<'div'>)}
                        initial={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
                        transition={DEFAULT_DIALOG_SPRING}
                        className={DIALOG_POPUP_CLASS}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <DialogPrimitive.Title className="text-lg font-bold tracking-tight text-ink">
                            {title}
                          </DialogPrimitive.Title>
                          {dismissible && onClose ? (
                            <DialogPrimitive.Close
                              aria-label={VI_MESSAGES.common.close}
                              title={VI_MESSAGES.common.close}
                              className="inline-flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border border-border-strong bg-surface-subtle/80 px-2.5 text-sm font-medium text-ink-muted transition-[transform,color,background-color] duration-150 hover:bg-surface-elevated hover:text-ink active:scale-95"
                            >
                              <SolarIcon name="close-circle-bold-duotone" className="h-5 w-5" />
                            </DialogPrimitive.Close>
                          ) : null}
                        </div>
                        <div>{children}</div>
                      </motion.div>
                    );
                  }}
                />
              </DialogPrimitive.Viewport>
            </DialogPrimitive.Portal>
          ) : null}
        </AnimatePresence>
      </DialogPrimitive.Root>
    </MotionConfig>
  );
}
