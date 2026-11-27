'use client';

import { ChevronDown, ChevronUp, Headset } from 'lucide-react';
import { useState } from 'react';
import { useIsMobileViewport } from '@/lib/use-media-query';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function ZaloButton() {
  const isMobile = useIsMobileViewport();
  // Default collapsed on mobile viewports (<768px) so the 2-circle support stack
  // never covers product cards or sticky action bars until the user expands it.
  const [collapseOverride, setCollapseOverride] = useState<boolean | null>(null);
  const isCollapsed = collapseOverride ?? isMobile;
  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/84363267165';
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://www.facebook.com/tdk1108/';

  return (
    <div
      role="region"
      aria-label={VI_MESSAGES.nav.supportDockAria}
      data-testid={TEST_IDS.layout.supportDock}
      data-no-grid-cascade=""
      className="fixed right-2.5 bottom-20 z-30 flex flex-col items-end gap-2 md:right-4 md:bottom-4 md:gap-2.5"
    >
      {isCollapsed ? (
        <button
          type="button"
          onClick={() => setCollapseOverride(false)}
          aria-expanded={false}
          aria-label={VI_MESSAGES.nav.supportExpandAria}
          data-testid={TEST_IDS.layout.supportExpandButton}
          data-sfx="toggle"
          className="mtx-shadow-sm inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-control border-2 border-border-strong bg-surface/95 px-2.5 py-1.5 text-xs font-semibold text-ink backdrop-blur-sm hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal md:min-h-10 md:gap-2 md:px-3 md:py-2"
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
            className="zalo-heartbeat relative inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 bg-[#0866ff] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal md:h-14 md:w-14"
          >
            <span
              aria-hidden="true"
              className="zalo-pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-[#4599FF] bg-[#0866ff]/20"
            />
            <span
              aria-hidden="true"
              className="zalo-pulse-ring zalo-pulse-ring-delay pointer-events-none absolute inset-0 rounded-full border-2 border-[#7CC0FF] bg-[#0866ff]/15"
            />
            <img src="/fb.svg" alt="" className="relative h-full w-full rounded-full object-cover" />
          </a>

          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={VI_MESSAGES.nav.zaloSupportLabel}
            title={VI_MESSAGES.nav.zaloSupportLabel}
            data-testid={TEST_IDS.layout.zaloFloatButton}
            className="zalo-heartbeat relative inline-flex h-11 w-11 items-center justify-center rounded-[11px] border-2 border-white/80 bg-[#0068FF] shadow-lg focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-signal md:h-14 md:w-14 md:rounded-[14px]"
          >
            <span
              aria-hidden="true"
              className="zalo-pulse-ring pointer-events-none absolute inset-0 rounded-[11px] border-2 border-[#3897FF] bg-[#0068FF]/20 md:rounded-[14px]"
            />
            <span
              aria-hidden="true"
              className="zalo-pulse-ring zalo-pulse-ring-delay pointer-events-none absolute inset-0 rounded-[11px] border-2 border-[#60A5FA] bg-[#0068FF]/15 md:rounded-[14px]"
            />
            <img
              src="/zalo.svg"
              alt=""
              className="relative h-full w-full rounded-[9px] object-cover md:rounded-[12px]"
            />
          </a>

          <button
            type="button"
            onClick={() => setCollapseOverride(true)}
            aria-expanded={true}
            aria-label={VI_MESSAGES.nav.supportCollapseAria}
            title={VI_MESSAGES.nav.supportCollapseAria}
            data-testid={TEST_IDS.layout.supportCollapseToggle}
            data-sfx="toggle"
            className="mtx-shadow-sm inline-flex h-8 w-11 cursor-pointer items-center justify-center rounded-control border-2 border-border-strong bg-surface text-ink hover:border-signal hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal md:w-14"
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
