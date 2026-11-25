import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppShell } from '@/features/layout/components/AppShell';
import { DEFAULT_OPENGRAPH_IMAGES, resolveSiteMetadataBase } from '@/lib/metadata';
import { QueryProvider } from '@/lib/query-provider';
import { getLandingScrollInitScript } from '@/lib/landing-scroll';
import { getThemeInitScript } from '@/lib/theme';
import { BRAND_LOGO_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import './globals.css';

const chakraPetch = Chakra_Petch({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700'],
  variable: '--font-chakra-petch',
  display: 'swap',
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: resolveSiteMetadataBase(),
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
    images: DEFAULT_OPENGRAPH_IMAGES,
  },
  twitter: {
    card: 'summary',
    images: [BRAND_LOGO_PATH],
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
      className={`${chakraPetch.variable} ${jetBrainsMono.variable} ${beVietnamPro.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark" />
        <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
        <script dangerouslySetInnerHTML={{ __html: getLandingScrollInitScript() }} />
      </head>
      <body className="min-h-screen overflow-x-clip bg-bg font-sans text-ink antialiased">
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
