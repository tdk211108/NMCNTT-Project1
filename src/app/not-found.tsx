import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Feedback';
import { buildPageMetadata } from '@/lib/metadata';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export const metadata: Metadata = buildPageMetadata({
  title: VI_MESSAGES.errors.notFoundTitle,
  description: VI_MESSAGES.errors.notFoundDesc,
  noIndex: true,
});

export default function NotFoundPage() {
  return (
    <div data-testid={TEST_IDS.errors.notFoundPage} className="mx-auto max-w-xl py-10">
      <EmptyState
        title={VI_MESSAGES.errors.notFoundTitle}
        description={VI_MESSAGES.errors.notFoundDesc}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/" data-testid={TEST_IDS.errors.backHomeButton}>
              <Button variant="primary">{VI_MESSAGES.errors.backHomeAction}</Button>
            </Link>
            <Link href="/cpu">
              <Button variant="outline">{VI_MESSAGES.errors.browseCpuAction}</Button>
            </Link>
          </div>
        }
      />
    </div>
  );
}
