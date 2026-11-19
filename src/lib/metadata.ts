import type { Metadata } from 'next';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface PageMetadataInput {
  title: string;
  description?: string;
  noIndex?: boolean;
}

/**
 * Shared metadata builder so every App Router page shares consistent OpenGraph defaults
 * while letting private routes opt out of search indexing uniformly.
 */
export function buildPageMetadata({
  title,
  description = VI_MESSAGES.brand.tagline,
  noIndex = false,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    openGraph: {
      type: 'website',
      locale: 'vi_VN',
      siteName: VI_MESSAGES.brand.name,
      title: `${title} | ${VI_MESSAGES.brand.name}`,
      description,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
