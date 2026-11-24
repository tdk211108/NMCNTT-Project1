'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { BrandMark } from './BrandMark';
import { getChromeContainerClass } from './layout-width';

export function Footer() {
  const containerClass = getChromeContainerClass();
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/tdk211108/NMCNTT-Project1';

  return (
    <footer className="relative z-10 mt-auto border-t-2 border-border-strong bg-surface pt-6 pb-20">
      <div className={`${containerClass} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={VI_MESSAGES.nav.githubLabel}
            data-testid={TEST_IDS.layout.footerGithubButton}
            className="mtx-shadow-sm inline-flex min-h-10 items-center gap-2 rounded-control border-2 border-border-strong bg-surface-subtle px-3 py-1.5 text-sm font-semibold text-ink hover:border-signal active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <span
              aria-hidden="true"
              className="inline-block h-5 w-5 shrink-0 bg-current [mask-image:url('/icons/github.svg')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain]"
            />
            <span>GitHub</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          </a>
          <BrandMark size="sm" testId={TEST_IDS.layout.footerBrandLink} />
          <span className="text-xs text-ink-muted">{VI_MESSAGES.brand.tagline}</span>
        </div>

        <nav
          aria-label="Chính sách"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted"
        >
          <Link
            href="/policies/warranty"
            data-testid={TEST_IDS.layout.footerLinkWarranty}
            className="hover:text-ink"
          >
            {VI_MESSAGES.policies.warrantyTitle}
          </Link>
          <Link
            href="/policies/payment-shipping"
            data-testid={TEST_IDS.layout.footerLinkPaymentShipping}
            className="hover:text-ink"
          >
            {VI_MESSAGES.policies.paymentShippingTitle}
          </Link>
          <Link
            href="/policies/contact"
            data-testid={TEST_IDS.layout.footerLinkContact}
            className="hover:text-ink"
          >
            {VI_MESSAGES.policies.contactTitle}
          </Link>
          <Link
            href="/policies/privacy"
            data-testid={TEST_IDS.layout.footerLinkPrivacy}
            className="hover:text-ink"
          >
            {VI_MESSAGES.policies.privacyTitle}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
