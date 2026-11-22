'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { PLACEHOLDER_IMAGE_PATH } from '@/shared/constants';

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
 * Lightswind Lens magnifying zoom overlay for large non-thumbnail hardware images.
 * Drives pointer coordinates via CSS custom properties in rAF to eliminate 60fps re-renders.
 */
export function ZoomableImageFrame({
  children,
  className = '',
  zoomScale = 1.85,
  lensSize = 156,
}: ZoomableImageFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number | null>(null);

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

  const radius = lensSize / 2;

  return (
    <div
      ref={frameRef}
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
      className={`zoom-frame-cursor relative overflow-hidden ${className}`}
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
  );
}
