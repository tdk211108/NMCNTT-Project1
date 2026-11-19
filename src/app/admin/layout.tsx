import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/features/admin/components/AdminShell';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.nav.adminMode,
  noIndex: true,
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
