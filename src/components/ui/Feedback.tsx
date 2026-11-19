import { VI_MESSAGES } from '@/shared/messages/vi';

export function Spinner({ label = VI_MESSAGES.common.loading }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 py-6 text-sm text-ink-muted">
      <span
        aria-hidden="true"
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-muted border-t-transparent"
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
      className="rounded-card border border-border bg-surface-subtle p-6 text-center"
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
