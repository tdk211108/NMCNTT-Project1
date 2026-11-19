import { Card } from '@/components/ui/Card';
import { VI_MESSAGES } from '@/shared/messages/vi';

export default function ContactPolicyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.policies.contactTitle}</h1>
      <Card className="flex flex-col gap-3 text-sm leading-relaxed text-ink">
        <p>{VI_MESSAGES.policies.contactBody}</p>
        <p className="text-ink-muted">{VI_MESSAGES.policies.contactDetails}</p>
      </Card>
    </div>
  );
}
