import Link from 'next/link';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export function Footer() {
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/tdk211108/NMCNTT-Project1';

  return (
    <footer className="mt-auto border-t border-border bg-surface pt-6 pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={VI_MESSAGES.nav.githubLabel}
            data-testid={TEST_IDS.layout.footerGithubButton}
            className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface-subtle px-3 py-1.5 text-sm text-ink hover:border-border-strong"
          >
            <img src="/icons/github.svg" alt="" className="h-5 w-5" />
            <span>GitHub</span>
          </a>
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
