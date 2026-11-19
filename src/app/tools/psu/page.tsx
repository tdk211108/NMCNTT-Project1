import type { Metadata } from 'next';
import { PsuClient } from '@/features/psu/components/PsuClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.tools.psu.title,
  description: VI_MESSAGES.home.psuShortcutDesc,
});

export default async function PsuPage({
  searchParams,
}: {
  searchParams: Promise<{ cpu?: string; gpu?: string }>;
}) {
  const { cpu, gpu } = await searchParams;
  return (
    <PsuClient
      cpu={typeof cpu === 'string' ? cpu : undefined}
      gpu={typeof gpu === 'string' ? gpu : undefined}
    />
  );
}
