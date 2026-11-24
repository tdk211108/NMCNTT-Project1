import type { Metadata } from 'next';
import { HomeClient } from '@/features/home/components/HomeClient';
import { DEFAULT_OPENGRAPH_IMAGES } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = {
  description: VI_MESSAGES.brand.tagline,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: VI_MESSAGES.brand.name,
    title: `${VI_MESSAGES.brand.name} | ${VI_MESSAGES.brand.tagline}`,
    description: VI_MESSAGES.brand.tagline,
    images: DEFAULT_OPENGRAPH_IMAGES,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
