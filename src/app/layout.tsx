import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import './globals.css';

export const metadata: Metadata = {
  title: `${VI_MESSAGES.brand.name} | ${VI_MESSAGES.brand.tagline}`,
  description: VI_MESSAGES.brand.tagline,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
