import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { PolicyLayout } from '@/features/policies/PolicyLayout';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.policies.privacyTitle,
  description: VI_MESSAGES.policies.privacyIntro,
});

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout activePath="/policies/privacy" title={VI_MESSAGES.policies.privacyTitle}>
      <Card className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.privacyIntro}</p>

        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            <tr className="border-b border-border">
              <th className="w-44 bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                {VI_MESSAGES.policies.privacyDataCollectedLabel}
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyDataCollected}</td>
            </tr>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                {VI_MESSAGES.policies.privacyPurposeLabel}
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyPurpose}</td>
            </tr>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                {VI_MESSAGES.policies.privacyCookiesLabel}
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyCookies}</td>
            </tr>
            <tr>
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                {VI_MESSAGES.policies.privacyDeletionLabel}
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyDeletion}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </PolicyLayout>
  );
}
