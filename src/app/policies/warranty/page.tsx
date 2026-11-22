import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.policies.warrantyTitle,
  description: VI_MESSAGES.policies.warrantyBody,
});

export default function WarrantyPolicyPage() {
  return (
    <PolicyLayout activePath="/policies/warranty" title={VI_MESSAGES.policies.warrantyTitle}>
      <Card className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.warrantyBody}</p>
        <p className="text-ink-muted">{VI_MESSAGES.policies.warrantyDetails}</p>
      </Card>
    </PolicyLayout>
  );
}
