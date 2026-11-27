import { Scale } from 'lucide-react';
import Link from 'next/link';
import { AnimatedCartButton } from '@/components/ui/AnimatedCartButton';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ProductCard as ProductCardDto } from '@/shared/types';

export type ProductCardVariant = 'compact' | 'catalog';

export interface ProductCardProps {
  product: ProductCardDto;
  variant?: ProductCardVariant;
  onBuyNow: (product: ProductCardDto) => void;
  onAddToCart: (product: ProductCardDto) => void;
  onCompare: (product: ProductCardDto) => void;
}

const CARD_VARIANT_STYLES: Record<
  ProductCardVariant,
  {
    card: string;
    bodyGap: string;
    media: string;
    title: string;
    price: string;
    specs: string;
  }
> = {
  compact: {
    card: 'gap-2.5 p-3',
    bodyGap: 'gap-2.5 sm:gap-2',
    media: 'h-24 w-24 shrink-0 p-1 sm:h-auto sm:w-full sm:aspect-[4/3] sm:max-h-48 sm:p-1.5',
    title: 'text-sm leading-snug font-semibold',
    price: 'text-base',
    specs: 'gap-x-2.5 gap-y-0.5 pt-2 text-[11px]',
  },
  catalog: {
    card: 'gap-3 p-3 sm:gap-3.5 sm:p-4',
    bodyGap: 'gap-2.5',
    media: 'h-24 w-24 shrink-0 p-1.5 sm:h-auto sm:w-full sm:aspect-[4/3] sm:p-2.5',
    title: 'text-sm leading-snug font-bold sm:text-base',
    price: 'text-base sm:text-lg',
    specs: 'gap-x-3 gap-y-1 pt-2 text-xs',
  },
};

export function ProductCard({
  product,
  variant = 'compact',
  onBuyNow,
  onAddToCart,
  onCompare,
}: ProductCardProps) {
  const styles = CARD_VARIANT_STYLES[variant];

  return (
    <Card
      data-testid={TEST_IDS.listing.productCard(product.id)}
      className={`flex flex-col justify-between ${styles.card}`}
    >
      <div className={`flex flex-col ${styles.bodyGap}`}>
        <div className="flex flex-row items-start gap-3 sm:flex-col sm:items-stretch sm:gap-2">
          <Link
            href={`/products/${product.id}`}
            className={`group/card-img block overflow-hidden rounded-control border-2 border-border-strong bg-white ${styles.media}`}
          >
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="product-card-zoom-img h-full w-full object-contain"
            />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={vendorBadgeVariant(product.vendor)}>
                {product.vendor.toUpperCase()}
              </Badge>
              {product.aibBrand ? <Badge variant="aib">{product.aibBrand}</Badge> : null}
              {product.isLimitedEdition ? (
                <Badge variant="warning">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
              ) : null}
            </div>

            <Link
              href={`/products/${product.id}`}
              className={`${styles.title} text-ink hover:text-accent-ink`}
            >
              {product.name}
            </Link>

            <p className={`font-mono font-bold tabular-nums text-ink ${styles.price}`}>
              {formatVnd(product.priceVnd)}
            </p>
          </div>
        </div>

        <dl className={`grid grid-cols-2 border-t-2 border-border ${styles.specs}`}>
          {product.summary.map((item) => (
            <div key={item.key} className="flex flex-col">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-mono font-medium tabular-nums text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 pt-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-3">
        <Button
          variant="primary"
          size="sm"
          className="min-h-11 w-full"
          data-testid={TEST_IDS.listing.productCardBuyNow(product.id)}
          onClick={() => onBuyNow(product)}
        >
          {VI_MESSAGES.catalog.buyNow}
        </Button>
        <AnimatedCartButton
          ariaLabel={VI_MESSAGES.catalog.addToCartAria(product.name)}
          title={VI_MESSAGES.catalog.addToCart}
          size="card"
          testId={TEST_IDS.listing.productCardAddToCart(product.id)}
          onAdd={() => onAddToCart(product)}
        />
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 px-2.5 sm:col-span-2 sm:w-full sm:px-3.5"
          data-testid={TEST_IDS.listing.productCardCompare(product.id)}
          onClick={() => onCompare(product)}
        >
          <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{VI_MESSAGES.catalog.compare}</span>
        </Button>
      </div>
    </Card>
  );
}
