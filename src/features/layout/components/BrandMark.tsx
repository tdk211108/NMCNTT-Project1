import Link from 'next/link';
import { BRAND_LOGO_MARK_LIGHT_PATH, BRAND_LOGO_MARK_PATH } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';

export type BrandMarkSize = 'sm' | 'md' | 'compact';

const SIZE_STYLES: Record<BrandMarkSize, { frame: string; text: string }> = {
  sm: { frame: 'h-6 w-6', text: 'text-sm tracking-wider' },
  md: { frame: 'h-7 w-7 sm:h-8 sm:w-8', text: 'text-sm sm:text-lg tracking-wider' },
  compact: {
    frame: 'h-6 w-6 min-[400px]:h-7 min-[400px]:w-7',
    text: 'text-[13px] min-[390px]:text-sm min-[430px]:text-base lg:text-lg tracking-normal min-[400px]:tracking-wider',
  },
};

/**
 * Shared CoreRaster brand emblem + wordmark linking back to the storefront home page.
 * Renders transparent borderless dark/light marks synchronized to the active theme.
 */
export function BrandMark({
  size = 'md',
  testId,
}: {
  size?: BrandMarkSize;
  testId?: string;
}) {
  const styles = SIZE_STYLES[size];
  return (
    <Link
      href="/"
      data-testid={testId}
      className={`font-display inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap font-bold text-ink uppercase focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:gap-2 ${styles.text}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${styles.frame}`}
      >
        <img
          src={BRAND_LOGO_MARK_PATH}
          alt=""
          className="mtx-brand-dark-mark h-full w-full object-contain"
        />
        <img
          src={BRAND_LOGO_MARK_LIGHT_PATH}
          alt=""
          className="mtx-brand-light-mark h-full w-full object-contain"
        />
      </span>
      <span>{VI_MESSAGES.brand.name}</span>
    </Link>
  );
}
