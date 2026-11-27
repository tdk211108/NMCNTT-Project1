'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { BrandMark } from './BrandMark';
import { getChromeContainerClass } from '../layout-width';
import { POLICY_LINKS } from '../nav-items';

export function Footer() {
  const containerClass = getChromeContainerClass();
  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_REPO_URL || 'https://github.com/tdk211108/NMCNTT-Project1';

  return (
    <footer className="relative z-10 mt-auto border-t-2 border-border-strong bg-surface pt-6 pb-28 md:pb-20">
      <div className={`${containerClass} flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`}>
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
            <span>{VI_MESSAGES.nav.githubText}</span>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
          </a>
          <BrandMark size="sm" testId={TEST_IDS.layout.footerBrandLink} />
          <span className="text-xs text-ink-muted">{VI_MESSAGES.brand.tagline}</span>
        </div>

        <nav
          aria-label={VI_MESSAGES.nav.policiesLabel}
          className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-ink-muted sm:flex sm:flex-wrap sm:items-center"
        >
          {POLICY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.footerTestId}
              className="hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
