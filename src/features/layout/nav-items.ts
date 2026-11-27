import { Gauge, Layers, Scale, TrendingUp } from 'lucide-react';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export const HARDWARE_TOOL_LINKS = [
  {
    href: '/compare',
    label: VI_MESSAGES.nav.compare,
    description: VI_MESSAGES.nav.compareMenuDesc,
    Icon: Scale,
    headerTestId: TEST_IDS.header.toolsCompare,
  },
  {
    href: '/tools/combo',
    label: VI_MESSAGES.nav.combo,
    description: VI_MESSAGES.nav.comboMenuDesc,
    Icon: Layers,
    headerTestId: TEST_IDS.header.toolsCombo,
  },
  {
    href: '/tools/upgrade',
    label: VI_MESSAGES.nav.upgrade,
    description: VI_MESSAGES.nav.upgradeMenuDesc,
    Icon: TrendingUp,
    headerTestId: TEST_IDS.header.toolsUpgrade,
  },
  {
    href: '/tools/psu',
    label: VI_MESSAGES.nav.psu,
    description: VI_MESSAGES.nav.psuMenuDesc,
    Icon: Gauge,
    headerTestId: TEST_IDS.header.toolsPsu,
  },
] as const;

export const POLICY_LINKS = [
  {
    href: '/policies/warranty',
    label: VI_MESSAGES.policies.warrantyTitle,
    footerTestId: TEST_IDS.layout.footerLinkWarranty,
  },
  {
    href: '/policies/payment-shipping',
    label: VI_MESSAGES.policies.paymentShippingTitle,
    footerTestId: TEST_IDS.layout.footerLinkPaymentShipping,
  },
  {
    href: '/policies/contact',
    label: VI_MESSAGES.policies.contactTitle,
    footerTestId: TEST_IDS.layout.footerLinkContact,
  },
  {
    href: '/policies/privacy',
    label: VI_MESSAGES.policies.privacyTitle,
    footerTestId: TEST_IDS.layout.footerLinkPrivacy,
  },
] as const;
