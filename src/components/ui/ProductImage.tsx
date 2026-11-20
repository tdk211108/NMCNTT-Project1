'use client';

import { useRef, useState } from 'react';
import { PLACEHOLDER_IMAGE_PATH } from '@/shared/constants';

export interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  testId?: string;
  zoomOnHover?: boolean;
  zoomScale?: number;
}

export function ProductImage({
  src,
  alt,
  className = 'h-40 w-full object-contain',
  testId,
  zoomOnHover = false,
  zoomScale = 1.65,
}: ProductImageProps) {
  const normalizedSrc = src && src.trim().length > 0 ? src : PLACEHOLDER_IMAGE_PATH;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const displaySrc = failedSrc === normalizedSrc ? PLACEHOLDER_IMAGE_PATH : normalizedSrc;
  const imgRef = useRef<HTMLImageElement>(null);

  const imgEl = (
    <img
      ref={imgRef}
      src={displaySrc}
      alt={alt}
      loading="lazy"
      data-testid={testId}
      onError={() => {
        if (displaySrc !== PLACEHOLDER_IMAGE_PATH) {
          setFailedSrc(normalizedSrc);
        }
      }}
      style={
        zoomOnHover
          ? ({ '--zoom-scale': String(zoomScale) } as React.CSSProperties)
          : undefined
      }
      className={`rounded-[14px] bg-white ${
        zoomOnHover
          ? 'transition-transform duration-200 ease-out [@media(hover:hover)_and_(pointer:fine)]:group-hover/zoom:scale-[var(--zoom-scale)]'
          : ''
      } ${className}`}
    />
  );

  if (!zoomOnHover) {
    return imgEl;
  }

  return (
    <div
      className="group/zoom relative flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white [@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in"
      onMouseMove={(event) => {
        const img = imgRef.current;
        if (!img) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
        img.style.transformOrigin = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
      }}
      onMouseLeave={() => {
        if (imgRef.current) {
          imgRef.current.style.transformOrigin = '50% 50%';
        }
      }}
    >
      {imgEl}
    </div>
  );
}
