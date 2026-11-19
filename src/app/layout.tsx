import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppShell } from '@/features/layout/AppShell';
import { QueryProvider } from '@/lib/query-provider';
import { VI_MESSAGES } from '@/shared/messages/vi';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `${VI_MESSAGES.brand.name} | ${VI_MESSAGES.brand.tagline}`,
    template: `%s | ${VI_MESSAGES.brand.name}`,
  },
  description: VI_MESSAGES.brand.tagline,
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: VI_MESSAGES.brand.name,
    title: `${VI_MESSAGES.brand.name} | ${VI_MESSAGES.brand.tagline}`,
    description: VI_MESSAGES.brand.tagline,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-bg text-ink antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
