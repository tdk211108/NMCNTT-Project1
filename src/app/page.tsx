import type { Metadata } from 'next';
import { HomeClient } from '@/features/home/components/HomeClient';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = {
  description: VI_MESSAGES.home.heroSubtitle,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: VI_MESSAGES.brand.name,
    title: `${VI_MESSAGES.brand.name} | ${VI_MESSAGES.brand.tagline}`,
    description: VI_MESSAGES.home.heroSubtitle,
  },
};

export default function HomePage() {
  return <HomeClient />;
}
