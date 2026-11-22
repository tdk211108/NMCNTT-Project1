import type { Metadata } from 'next';
import { UpgradeAdvisorClient } from '@/features/upgrade/components/UpgradeAdvisorClient';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.tools.upgrade.title,
  description: VI_MESSAGES.home.upgradeShortcutDesc,
});

export default async function UpgradeAdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    current?: string;
    budget?: string;
    sameSocketOnly?: string;
    vendor?: string;
    sort?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <UpgradeAdvisorClient
      category={typeof sp.category === 'string' ? sp.category : undefined}
      current={typeof sp.current === 'string' ? sp.current : undefined}
      budget={typeof sp.budget === 'string' ? sp.budget : undefined}
      sameSocketOnly={typeof sp.sameSocketOnly === 'string' ? sp.sameSocketOnly : undefined}
      vendor={typeof sp.vendor === 'string' ? sp.vendor : undefined}
      sort={typeof sp.sort === 'string' ? sp.sort : undefined}
    />
  );
}
