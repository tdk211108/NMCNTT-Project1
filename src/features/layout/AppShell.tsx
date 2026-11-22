'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { Footer } from './Footer';
import { Header } from './Header';
import { InteractiveBackground } from './InteractiveBackground';
import { getMainContainerClass } from './layout-width';
import { UiSoundEffects } from './UiSoundEffects';
import { ZaloButton } from './ZaloButton';

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainClass = getMainContainerClass(pathname);

  return (
    <div className="relative flex min-h-screen flex-col text-ink">
      <UiSoundEffects />
      <InteractiveBackground />
      <Header />
      <main className={`${mainClass} relative z-10`}>{children}</main>
      <Footer />
      <ZaloButton />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
