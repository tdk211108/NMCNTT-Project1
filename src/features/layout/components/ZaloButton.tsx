'use client';

import { ChevronDown, ChevronUp, Headset } from 'lucide-react';
import { useState } from 'react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function ZaloButton() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/84363267165';
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/tdk1108/';

  return (
    <div
      role="region"
      aria-label={VI_MESSAGES.nav.supportDockAria}
      data-testid={TEST_IDS.layout.supportDock}
      data-no-grid-cascade=""
      className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2.5"
    >
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-expanded={false}
          aria-label={VI_MESSAGES.nav.supportExpandAria}
          data-testid={TEST_IDS.layout.supportExpandButton}
          data-sfx="toggle"
          className="mtx-shadow-sm inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-control border-2 border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          <Headset className="h-4 w-4 shrink-0 text-accent-ink" aria-hidden="true" />
          <span>{VI_MESSAGES.nav.supportExpandLabel}</span>
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        </button>
      ) : (
        <>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={VI_MESSAGES.nav.facebookSupportLabel}
            title={VI_MESSAGES.nav.facebookSupportLabel}
            data-testid={TEST_IDS.layout.facebookFloatButton}
            className="zalo-heartbeat relative inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-[#1877F2] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal"
          >
            <span
              aria-hidden="true"
              className="zalo-pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#4599FF] bg-[#1877F2]/40"
            />
            <span
              aria-hidden="true"
              className="zalo-pulse-ring zalo-pulse-ring-delay pointer-events-none absolute inset-0 rounded-full border-2 border-[#7CC0FF] bg-[#1877F2]/25"
            />
            <img src="/icons/facebook.svg" alt="" className="relative h-11 w-11 rounded-full" />
          </a>

          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={VI_MESSAGES.nav.zaloSupportLabel}
            title={VI_MESSAGES.nav.zaloSupportLabel}
            data-testid={TEST_IDS.layout.zaloFloatButton}
            className="zalo-heartbeat relative inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 bg-[#0068FF] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal"
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

          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            aria-expanded={true}
            aria-label={VI_MESSAGES.nav.supportCollapseAria}
            title={VI_MESSAGES.nav.supportCollapseAria}
            data-testid={TEST_IDS.layout.supportCollapseToggle}
            data-sfx="toggle"
            className="mtx-shadow-sm inline-flex h-8 w-14 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
