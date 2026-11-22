import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.policies.contactTitle,
  description: VI_MESSAGES.policies.contactBody,
});

export default function ContactPolicyPage() {
  return (
    <PolicyLayout activePath="/policies/contact" title={VI_MESSAGES.policies.contactTitle}>
      <Card className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.contactBody}</p>
        <p className="text-ink-muted">{VI_MESSAGES.policies.contactDetails}</p>
      </Card>
    </PolicyLayout>
  );
}
