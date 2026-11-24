import type { Metadata } from 'next';
import { BRAND_LOGO_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface PageMetadataInput {
  title: string;
  description?: string;
  noIndex?: boolean;
}

export const DEFAULT_OPENGRAPH_IMAGES = [
  {
    url: BRAND_LOGO_PATH,
    width: 1200,
    height: 1200,
    alt: VI_MESSAGES.brand.name,
  },
];

/**
 * Resolves the canonical origin URL for Next.js metadataBase so relative social images
 * expand cleanly in production, Vercel preview deploys, and local development.
 */
export function resolveSiteMetadataBase(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (raw && raw.trim().length > 0) {
    const trimmed = raw.trim();
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      return new URL(normalized);
    } catch {
      return new URL('http://localhost:3000');
    }
  }
  return new URL('http://localhost:3000');
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
      images: DEFAULT_OPENGRAPH_IMAGES,
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
