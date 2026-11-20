import type { ReactNode } from 'react';
import { ToastContainer } from '@/components/ui/Toast';
import { AuthModal } from '@/features/auth/components/AuthModal';
import { AeroBackdrop } from './AeroBackdrop';
import { Footer } from './Footer';
import { Header } from './Header';
import { ZaloButton } from './ZaloButton';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip text-ink">
      <AeroBackdrop />
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      <Footer />
      <ZaloButton />
      <ToastContainer />
      <AuthModal />
    </div>
  );
}
