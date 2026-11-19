'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app-error-boundary]', error);
  }, [error]);

  return (
    <div data-testid={TEST_IDS.errors.runtimeErrorPage} className="mx-auto max-w-xl py-10">
      <EmptyState
        title={VI_MESSAGES.errors.runtimeTitle}
        description={VI_MESSAGES.errors.runtimeDesc}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              data-testid={TEST_IDS.errors.retryButton}
              onClick={reset}
            >
              {VI_MESSAGES.errors.retryAction}
            </Button>
            <Link href="/" data-testid={TEST_IDS.errors.backHomeButton}>
              <Button variant="outline">{VI_MESSAGES.errors.backHomeAction}</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
