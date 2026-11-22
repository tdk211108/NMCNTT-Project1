import type { Metadata } from 'next';
import { ComboAdvisorClient } from '@/features/combo/components/ComboAdvisorClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.tools.combo.title,
  description: VI_MESSAGES.home.comboShortcutDesc,
});

export default async function ComboAdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{
    budget?: string;
    purpose?: string;
    cpuVendor?: string;
    gpuVendor?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <ComboAdvisorClient
      budget={typeof sp.budget === 'string' ? sp.budget : undefined}
      purpose={typeof sp.purpose === 'string' ? sp.purpose : undefined}
      cpuVendor={typeof sp.cpuVendor === 'string' ? sp.cpuVendor : undefined}
      gpuVendor={typeof sp.gpuVendor === 'string' ? sp.gpuVendor : undefined}
    />
  );
}
