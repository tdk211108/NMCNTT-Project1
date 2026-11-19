import type { Metadata } from 'next';
import { CompareClient } from '@/features/compare/components/CompareClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.tools.compare.title,
  description: VI_MESSAGES.home.compareShortcutDesc,
});

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  return <CompareClient rawIds={typeof ids === 'string' ? ids : ''} />;
}
