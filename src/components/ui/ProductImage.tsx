'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { PLACEHOLDER_IMAGE_PATH } from '@/shared/constants';

export interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  testId?: string;
}

export function ProductImage({
  src,
  alt,
  className = 'h-40 w-full object-contain',
  testId,
}: ProductImageProps) {
  const normalizedSrc = src && src.trim().length > 0 ? src : PLACEHOLDER_IMAGE_PATH;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displaySrc = failedSrc === normalizedSrc ? PLACEHOLDER_IMAGE_PATH : normalizedSrc;

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading="lazy"
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
}

function canUseInteractiveZoom(event: ReactPointerEvent<HTMLDivElement>): boolean {
  if (event.pointerType !== 'mouse' || typeof window === 'undefined') {
    return false;
  }
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Interactive cursor-tracking zoom frame for large product images.
 * Updates DOM transform directly via ref to stay off React's render loop.
 */
export function ZoomableImageFrame({
  children,
  className = '',
  zoomScale = 1.75,
}: ZoomableImageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const enteredAtRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  function applyZoomAtPointer(clientX: number, clientY: number, transitionValue: string) {
    const frame = frameRef.current;
    const target = targetRef.current;
    if (!frame || !target) return;

    const rect = frame.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const clamp = (val: number) => Math.max(-0.5, Math.min(0.5, val));
    const u = clamp((clientX - rect.left) / rect.width - 0.5);
    const v = clamp((clientY - rect.top) / rect.height - 0.5);
    const tx = -u * (zoomScale - 1) * 100;
    const ty = -v * (zoomScale - 1) * 100;

    target.style.transition = transitionValue;
    target.style.transform = `translate3d(${tx.toFixed(2)}%, ${ty.toFixed(2)}%, 0) scale(${zoomScale})`;
  }

  function handlePointerEnter(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canUseInteractiveZoom(event)) return;
    activeRef.current = true;
    enteredAtRef.current = performance.now();
    applyZoomAtPointer(event.clientX, event.clientY, 'transform 180ms cubic-bezier(0.23, 1, 0.32, 1)');
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!activeRef.current) return;
    const { clientX, clientY } = event;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (!activeRef.current) return;
      const settled = performance.now() - enteredAtRef.current > 180;
      applyZoomAtPointer(
        clientX,
        clientY,
        settled ? 'transform 45ms linear' : 'transform 180ms cubic-bezier(0.23, 1, 0.32, 1)',
      );
    });
  }

  function resetZoom() {
    activeRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const target = targetRef.current;
    if (!target) return;
    target.style.transition = 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)';
    target.style.transform = 'translate3d(0, 0, 0) scale(1)';
  }

  return (
    <div
      ref={frameRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetZoom}
      onPointerCancel={resetZoom}
      className={`zoom-frame-cursor relative overflow-hidden ${className}`}
    >
      <div ref={targetRef} className="flex h-full w-full items-center justify-center">
        {children}
      </div>
    </div>
  );
}
