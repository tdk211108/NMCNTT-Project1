import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.policies.privacyTitle,
  description: VI_MESSAGES.policies.privacyIntro,
});

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.policies.privacyTitle}</h1>
      <Card className="flex flex-col gap-4 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.privacyIntro}</p>

        <table className="w-full border-collapse text-left text-sm">
          <tbody>
            <tr className="border-b border-border">
              <th className="w-44 bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                Dữ liệu tiếp nhận
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyDataCollected}</td>
            </tr>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                Mục đích sử dụng
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyPurpose}</td>
            </tr>
            <tr className="border-b border-border">
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                Cookie và lưu trữ
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyCookies}</td>
            </tr>
            <tr>
              <th className="bg-surface-subtle px-3 py-2 align-top font-medium text-ink-muted">
                Yêu cầu xóa dữ liệu
              </th>
              <td className="px-3 py-2 text-ink">{VI_MESSAGES.policies.privacyDeletion}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
