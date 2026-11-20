'use client';

import {
  createContext,
  useContext,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react';

export type DialogFromDirection = 'top' | 'bottom' | 'left' | 'right';

export const DEFAULT_DIALOG_SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const DIALOG_BACKDROP_CLASS =
  'fixed inset-0 z-50 bg-[#030816]/56 backdrop-blur-[4px]';

export const DIALOG_VIEWPORT_CLASS =
  'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4';

export const DIALOG_POPUP_CLASS =
  'aero-glass-elevated relative w-full max-w-lg rounded-modal p-6 text-ink outline-none';

export const DIALOG_BACKDROP_MOTION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: 'easeOut' as const },
};

export function getDialogSlideOffset(from: DialogFromDirection = 'top'): { x: number; y: number } {
  switch (from) {
    case 'bottom':
      return { x: 0, y: 18 };
    case 'left':
      return { x: -18, y: 0 };
    case 'right':
      return { x: 18, y: 0 };
    case 'top':
    default:
      return { x: 0, y: -18 };
  }
}

interface AlertDialogContextValue {
  isOpen: boolean;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialogContext(): AlertDialogContextValue {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) {
    throw new Error('AlertDialog compound components must be rendered inside <AlertDialog>.');
  }
  return ctx;
}

export interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    eventDetails: AlertDialogPrimitive.Root.ChangeEventDetails,
  ) => void;
  dismissible?: boolean;
  children: ReactNode;
}

/**
 * Animate UI Base UI AlertDialog root with reduced-motion support and optional dismissal guard.
 */
export function AlertDialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  dismissible = true,
  children,
}: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = openProp !== undefined ? openProp : uncontrolledOpen;

  function handleOpenChange(
    nextOpen: boolean,
    eventDetails: AlertDialogPrimitive.Root.ChangeEventDetails,
  ) {
    if (!nextOpen && !dismissible) {
      eventDetails.cancel();
      return;
    }
    if (openProp === undefined) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen, eventDetails);
  }

  return (
    <MotionConfig reducedMotion="user">
      <AlertDialogContext.Provider value={{ isOpen }}>
        <AlertDialogPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
          {children}
        </AlertDialogPrimitive.Root>
      </AlertDialogContext.Provider>
    </MotionConfig>
  );
}

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export interface AlertDialogPortalProps {
  container?: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Portal>['container'];
  children: ReactNode;
}

export function AlertDialogPortal({ container, children }: AlertDialogPortalProps) {
  const { isOpen } = useAlertDialogContext();

  return (
    <AnimatePresence>
      {isOpen ? (
        <AlertDialogPrimitive.Portal key="alert-dialog-portal" keepMounted container={container}>
          {children}
        </AlertDialogPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
}

export function AlertDialogBackdrop({
  className = '',
}: {
  className?: string;
}) {
  return (
    <AlertDialogPrimitive.Backdrop
      forceRender
      render={(renderProps) => {
        const { hidden: _hidden, ...domProps } = renderProps;
        void _hidden;
        return (
          <motion.div
            {...(domProps as HTMLMotionProps<'div'>)}
            {...DIALOG_BACKDROP_MOTION}
            className={`${DIALOG_BACKDROP_CLASS} ${className}`}
          />
        );
      }}
    />
  );
}

export interface AlertDialogPopupProps extends ComponentPropsWithoutRef<'div'> {
  from?: DialogFromDirection;
  transition?: Transition;
  viewportClassName?: string;
}

export function AlertDialogPopup({
  from = 'top',
  transition = DEFAULT_DIALOG_SPRING,
  className = '',
  viewportClassName = '',
  children,
  ...rest
}: AlertDialogPopupProps) {
  const offset = getDialogSlideOffset(from);

  return (
    <AlertDialogPrimitive.Viewport className={`${DIALOG_VIEWPORT_CLASS} ${viewportClassName}`}>
      <AlertDialogPrimitive.Popup
        {...rest}
        render={(renderProps) => {
          const { hidden: _hidden, ...domProps } = renderProps;
          void _hidden;
          return (
            <motion.div
              {...(domProps as HTMLMotionProps<'div'>)}
              initial={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, x: offset.x, y: offset.y }}
              transition={transition}
              className={`${DIALOG_POPUP_CLASS} ${className}`}
            >
              {children}
            </motion.div>
          );
        }}
      />
    </AlertDialogPrimitive.Viewport>
  );
}

export function AlertDialogHeader({
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`mb-4 flex flex-col gap-1.5 ${className}`} {...rest} />;
}

export function AlertDialogTitle({
  className = '',
  ...rest
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={`text-lg font-bold tracking-tight text-ink ${className}`}
      {...rest}
    />
  );
}

export function AlertDialogDescription({
  className = '',
  ...rest
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={`text-sm leading-relaxed text-ink-muted ${className}`}
      {...rest}
    />
  );
}

export function AlertDialogFooter({
  className = '',
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${className}`}
      {...rest}
    />
  );
}

export const AlertDialogClose = AlertDialogPrimitive.Close;
export const AlertDialogCancel = AlertDialogPrimitive.Close;
