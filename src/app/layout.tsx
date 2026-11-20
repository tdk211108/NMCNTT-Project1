import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppShell } from '@/features/layout/AppShell';
import { QueryProvider } from '@/lib/query-provider';
import { VI_MESSAGES } from '@/shared/messages/vi';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

const THEME_INIT_SCRIPT = `(() => {
  try {
    var stored = localStorage.getItem('techcore-theme');
    var hasPin = stored === 'light' || stored === 'dark';
    var isDark = hasPin ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', hasPin ? stored : 'light dark');
  } catch {}
})();`;

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
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased selection:bg-accent/25 selection:text-ink">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
