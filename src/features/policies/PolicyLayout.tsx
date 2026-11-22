import Link from 'next/link';
import type { ReactNode } from 'react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { VI_MESSAGES } from '@/shared/messages/vi';

export interface PolicyLayoutProps {
  activePath:
    | '/policies/warranty'
    | '/policies/payment-shipping'
    | '/policies/contact'
    | '/policies/privacy';
  title: string;
  children?: ReactNode;
}

const POLICY_LINKS: Array<{
  href: PolicyLayoutProps['activePath'];
  label: string;
}> = [
  { href: '/policies/warranty', label: VI_MESSAGES.policies.warrantyTitle },
  { href: '/policies/payment-shipping', label: VI_MESSAGES.policies.paymentShippingTitle },
  { href: '/policies/contact', label: VI_MESSAGES.policies.contactTitle },
  { href: '/policies/privacy', label: VI_MESSAGES.policies.privacyTitle },
];

export function PolicyLayout({ activePath, title, children }: PolicyLayoutProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: title, href: activePath },
        ]}
      />

      <nav aria-label={VI_MESSAGES.nav.policiesLabel} className="flex flex-wrap gap-2.5">
        {POLICY_LINKS.map((item) => {
          const isCurrent = item.href === activePath;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`inline-flex min-h-9 items-center rounded-control border-2 px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
                isCurrent
                  ? 'border-border-strong bg-primary text-primary-fg mtx-shadow-sm'
                  : 'border-border-strong bg-surface text-ink-muted hover:border-signal hover:text-ink'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>

      {children}
    </div>
  );
}
