import { VI_MESSAGES } from '@/shared/messages/vi';
import { SpectrumLoader } from './SpectrumLoader';

export function Spinner({ label = VI_MESSAGES.common.loading }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-sm text-ink-muted">
      <SpectrumLoader size={28} strokeWidth={3.2} />
      <span className="font-mono text-xs tracking-wide">{label}</span>
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
      className="mtx-shadow rounded-card border-2 border-border-strong bg-surface-subtle p-6 text-center"
    >
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
