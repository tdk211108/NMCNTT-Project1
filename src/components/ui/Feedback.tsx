import { VI_MESSAGES } from '@/shared/messages/vi';
import { AeroIconBadge } from './Icons';

export function Spinner({ label = VI_MESSAGES.common.loading }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2.5 py-8 text-sm font-medium text-ink-muted">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  testId,
  action,
}: {
  title: string;
  description?: string;
  testId?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-testid={testId}
      className="aero-glass flex flex-col items-center rounded-card p-8 text-center"
    >
      <AeroIconBadge name="info-circle-bold-duotone" size="lg" className="mb-3" />
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1.5 max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
