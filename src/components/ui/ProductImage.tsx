'use client';

import { useState } from 'react';
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
