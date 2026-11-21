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
      title={VI_MESSAGES.nav.zaloSupportLabel}
      data-testid={TEST_IDS.layout.zaloFloatButton}
      className="zalo-heartbeat fixed right-4 bottom-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-[#0068FF] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal"
    >
      <span
        aria-hidden="true"
        className="zalo-pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#3897FF] bg-[#0068FF]/45"
      />
      <span
        aria-hidden="true"
        className="zalo-pulse-ring zalo-pulse-ring-delay pointer-events-none absolute inset-0 rounded-full border-2 border-[#60A5FA] bg-[#0068FF]/30"
      />
      <img src="/icons/zalo.svg" alt="" className="relative h-11 w-11 rounded-full" />
    </a>
  );
}
