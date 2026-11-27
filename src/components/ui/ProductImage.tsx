'use client';

import { X } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import {
  isOutsideDialogBackdropClick,
  prefersReducedMotionNow,
  useNativeDialog,
} from '@/lib/client-hooks';
import { PLACEHOLDER_IMAGE_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  testId?: string;
}

export function ProductImage({
  src,
  alt,
  className = 'h-40 w-full object-contain',
  loading = 'lazy',
  testId,
}: ProductImageProps) {
  const normalizedSrc = src && src.trim().length > 0 ? src : PLACEHOLDER_IMAGE_PATH;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displaySrc = failedSrc === normalizedSrc ? PLACEHOLDER_IMAGE_PATH : normalizedSrc;

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      decoding="async"
      data-testid={testId}
      onError={() => {
        if (displaySrc !== PLACEHOLDER_IMAGE_PATH) {
          setFailedSrc(normalizedSrc);
        }
      }}
      className={`rounded-control bg-white ${className}`}
    />
  );
}

export interface ZoomableImageFrameProps {
  children: ReactNode;
  className?: string;
  zoomScale?: number;
  lensSize?: number;
  lightboxSrc?: string | null;
  lightboxAlt?: string;
  lightboxTestId?: string;
}

interface ProductImageLightboxProps {
  open: boolean;
  src: string | null | undefined;
  alt: string;
  onClose: () => void;
}

function ProductImageLightbox({ open, src, alt, onClose }: ProductImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useNativeDialog(dialogRef, open);

  if (!open) {
    return null;
  }

  function handleDialogClick(event: ReactMouseEvent<HTMLDialogElement>) {
    if (isOutsideDialogBackdropClick(event, dialogRef.current)) {
      dialogRef.current?.close();
    }
  }

  function handleCloseClick() {
    const dialog = dialogRef.current;
    if (dialog?.open) {
      dialog.close();
    } else {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={alt}
      data-testid={TEST_IDS.layout.imageLightboxDialog}
      onClose={onClose}
      onClick={handleDialogClick}
      {...({ closedby: 'any' } as Record<string, string>)}
      className="image-lightbox-dialog m-auto max-h-[94dvh] max-w-[94vw] overflow-visible border-0 bg-transparent p-0 shadow-none"
    >
      <div className="mtx-shadow-accent relative flex items-center justify-center rounded-card border-2 border-border-strong bg-white p-3 sm:p-5">
        <button
          type="button"
          autoFocus
          onClick={handleCloseClick}
          aria-label={VI_MESSAGES.common.close}
          data-testid={TEST_IDS.layout.imageLightboxClose}
          className="absolute top-2.5 right-2.5 z-10 inline-flex min-h-10 min-w-10 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink shadow-md hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-signal"
        >
          <X className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{VI_MESSAGES.common.close}</span>
        </button>

        <ProductImage
          src={src}
          alt={alt}
          loading="eager"
          className="h-auto max-h-[82dvh] w-auto max-w-[86vw] object-contain"
        />
      </div>
    </dialog>
  );
}

function canUseInteractiveZoom(event: ReactPointerEvent<HTMLDivElement>): boolean {
  if (event.pointerType !== 'mouse' || typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !prefersReducedMotionNow()
  );
}

/**
 * Lightswind Lens magnifying zoom overlay for large non-thumbnail hardware images,
 * optionally opening a native top-layer full-size lightbox on click or keyboard activation.
 */
export function ZoomableImageFrame({
  children,
  className = '',
  zoomScale = 1.85,
  lensSize = 156,
  lightboxSrc,
  lightboxAlt,
  lightboxTestId,
}: ZoomableImageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const rafRef = useRef<number | null>(null);
  const hasLightbox = Boolean(lightboxAlt);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function writeCssCoords(clientX: number, clientY: number) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    frame.style.setProperty('--zoom-x', `${x.toFixed(1)}px`);
    frame.style.setProperty('--zoom-y', `${y.toFixed(1)}px`);
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canUseInteractiveZoom(event)) return;
    writeCssCoords(event.clientX, event.clientY);
    setIsHovering(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isHovering) return;
    const { clientX, clientY } = event;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      writeCssCoords(clientX, clientY);
    });
  }

  function handlePointerLeave() {
    setIsHovering(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function openLightbox() {
    if (!hasLightbox) return;
    handlePointerLeave();
    setLightboxOpen(true);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!hasLightbox) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openLightbox();
    }
  }

  const radius = lensSize / 2;

  return (
    <>
      <div
        ref={frameRef}
        role={hasLightbox ? 'button' : undefined}
        tabIndex={hasLightbox ? 0 : undefined}
        aria-label={lightboxAlt ? VI_MESSAGES.catalog.openFullImageAria(lightboxAlt) : undefined}
        data-testid={lightboxTestId}
        onClick={hasLightbox ? openLightbox : undefined}
        onKeyDown={hasLightbox ? handleKeyDown : undefined}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        style={
          {
            '--zoom-x': '50%',
            '--zoom-y': '50%',
          } as CSSProperties
        }
        className={`zoom-frame-cursor relative overflow-hidden ${
          hasLightbox ? 'zoom-frame-interactive focus-visible:outline-2 focus-visible:outline-signal' : ''
        } ${className}`}
      >
        <div className="flex h-full w-full items-center justify-center">{children}</div>

        {isHovering ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              maskImage: `radial-gradient(circle ${radius}px at var(--zoom-x) var(--zoom-y), black 98%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${radius}px at var(--zoom-x) var(--zoom-y), black 98%, transparent 100%)`,
            }}
          >
            <div
              className="flex h-full w-full items-center justify-center bg-white"
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'var(--zoom-x) var(--zoom-y)',
              }}
            >
              {children}
            </div>
          </div>
        ) : null}

        {isHovering ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-30 rounded-full border-2 border-signal shadow-[0_0_0_2px_rgba(11,13,18,0.28),0_10px_24px_rgba(0,0,0,0.28)]"
            style={{
              width: lensSize,
              height: lensSize,
              left: `calc(var(--zoom-x) - ${radius}px)`,
              top: `calc(var(--zoom-y) - ${radius}px)`,
            }}
          />
        ) : null}
      </div>

      {hasLightbox && lightboxAlt ? (
        <ProductImageLightbox
          open={lightboxOpen}
          src={lightboxSrc}
          alt={lightboxAlt}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </>
  );
}
