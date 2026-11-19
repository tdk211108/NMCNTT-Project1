'use client';

import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function ZaloButton() {
  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/84363267165';

  return (
    <a
      href={zaloUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={VI_MESSAGES.nav.zaloSupportLabel}
      data-testid={TEST_IDS.layout.zaloFloatButton}
      className="fixed right-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full border border-border-strong bg-accent px-3.5 py-2.5 text-sm font-semibold text-accent-fg shadow-lg hover:opacity-90"
    >
      <img src="/icons/zalo.svg" alt="" className="h-5 w-5" />
      <span>Zalo</span>
    </a>
  );
}
