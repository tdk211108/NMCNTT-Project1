'use client';

import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function ZaloButton() {
  const zaloUrl = process.env.NEXT_PUBLIC_ZALO_URL || 'https://zalo.me/84363267165';

  return (
    <div className="aero-zalo-wrapper fixed right-4 bottom-4 z-30 inline-flex items-center justify-center">
      <span
        aria-hidden="true"
        className="aero-zalo-ring pointer-events-none absolute inset-0 rounded-full"
      />
      <a
        href={zaloUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={VI_MESSAGES.nav.zaloSupportLabel}
        title={VI_MESSAGES.nav.zaloSupportLabel}
        data-testid={TEST_IDS.layout.zaloFloatButton}
        className="aero-pill-cta aero-zalo-orb aero-zalo-heartbeat relative inline-flex h-14 w-14 items-center justify-center rounded-full border p-0 transition-[transform,filter] duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-95"
      >
        <svg
          aria-hidden="true"
          viewBox="6 7 36 34"
          fill="none"
          className="relative z-1 h-8 w-8 drop-shadow-[0_1px_2px_rgba(2,132,199,0.4)]"
        >
          <path
            d="M24 10C15.716 10 9 15.82 9 23c0 3.74 1.84 7.1 4.78 9.47-.22 1.82-.98 3.92-1.88 5.23-.26.38.07.88.52.78 2.49-.54 5.21-1.64 6.95-2.61 1.45.4 3.01.63 4.63.63 8.284 0 15-5.82 15-13s-6.716-13-15-13Z"
            fill="#FFFFFF"
          />
          <text
            x="24"
            y="23.2"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#0284C7"
            fontFamily="var(--font-sans), system-ui, sans-serif"
            fontSize="9.6"
            fontWeight="800"
            letterSpacing="-0.3"
          >
            Zalo
          </text>
        </svg>
      </a>
    </div>
  );
}
