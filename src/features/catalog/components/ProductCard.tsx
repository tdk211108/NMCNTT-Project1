import Link from 'next/link';
import { Badge, Card, VendorBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CartPlusIcon, SolarIcon } from '@/components/ui/Icons';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ProductCard as ProductCardDto } from '@/shared/types';

export interface ProductCardProps {
  product: ProductCardDto;
  onBuyNow: (product: ProductCardDto) => void;
  onAddToCart: (product: ProductCardDto) => void;
  onCompare: (product: ProductCardDto) => void;
}

export function ProductCard({
  product,
  onBuyNow,
  onAddToCart,
  onCompare,
}: ProductCardProps) {
  return (
    <Card
      data-testid={TEST_IDS.listing.productCard(product.id)}
      className="flex flex-col justify-between gap-3 p-4 transition-[transform,border-color,box-shadow] duration-150 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:border-border-strong"
    >
      <div className="flex flex-col gap-3">
        <Link
          href={`/products/${product.id}`}
          className="block aspect-square w-full overflow-hidden rounded-[14px] bg-white p-2 shadow-xs ring-1 ring-white/80 dark:ring-emerald-300/20"
        >
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-contain"
          />
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <VendorBadge vendor={product.vendor} />
          {product.aibBrand ? <Badge variant="accent">{product.aibBrand}</Badge> : null}
          {product.isLimitedEdition ? (
            <Badge variant="warning">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
          ) : null}
        </div>

        <Link
          href={`/products/${product.id}`}
          className="text-base leading-snug font-bold text-ink transition-colors hover:text-primary"
        >
          {product.name}
        </Link>

        <p className="font-mono text-lg font-bold tabular-nums text-primary">
          {formatVnd(product.priceVnd)}
        </p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-2.5 text-xs">
          {product.summary.map((item) => (
            <div key={item.key} className="flex flex-col">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-semibold text-ink">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="min-h-11 flex-1"
            data-testid={TEST_IDS.listing.productCardBuyNow(product.id)}
            onClick={() => onBuyNow(product)}
          >
            {VI_MESSAGES.catalog.buyNow}
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label={VI_MESSAGES.catalog.addToCartAria(product.name)}
            title={VI_MESSAGES.catalog.addToCart}
            className="h-11 w-11 shrink-0 rounded-full p-0"
            data-testid={TEST_IDS.listing.productCardAddToCart(product.id)}
            onClick={() => onAddToCart(product)}
          >
            <CartPlusIcon className="h-5 w-5 text-primary" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-testid={TEST_IDS.listing.productCardCompare(product.id)}
          onClick={() => onCompare(product)}
        >
          <SolarIcon name="scale-bold-duotone" className="h-4 w-4 text-primary" withShadow={false} />
          <span>{VI_MESSAGES.catalog.compare}</span>
        </Button>
      </div>
    </Card>
  );
}
