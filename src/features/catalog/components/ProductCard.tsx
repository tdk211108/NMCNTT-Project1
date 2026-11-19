import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CartPlusIcon } from '@/components/ui/Icons';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatNumberVi, formatVnd } from '@/lib/format';
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
      className="flex flex-col justify-between gap-3"
    >
      <div className="flex flex-col gap-3">
        <Link href={`/products/${product.id}`} className="block">
          <ProductImage src={product.imageUrl} alt={product.name} className="h-44 w-full object-contain p-2" />
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{product.vendor.toUpperCase()}</Badge>
          {product.aibBrand ? <Badge variant="accent">{product.aibBrand}</Badge> : null}
          {product.isLimitedEdition ? (
            <Badge variant="warning">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
          ) : null}
          {product.score.normalized !== null ? (
            <Badge variant="success">
              {formatNumberVi(product.score.normalized, 1)} / 100
            </Badge>
          ) : null}
        </div>

        <Link
          href={`/products/${product.id}`}
          className="text-base font-semibold text-ink hover:text-accent"
        >
          {product.name}
        </Link>

        <p className="text-lg font-bold text-primary">{formatVnd(product.priceVnd)}</p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-2 text-xs">
          {product.summary.map((item) => (
            <div key={item.key} className="flex flex-col">
              <dt className="text-ink-muted">{item.label}</dt>
              <dd className="font-medium text-ink">{item.value}</dd>
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
            className="h-11 w-11 shrink-0 p-0"
            data-testid={TEST_IDS.listing.productCardAddToCart(product.id)}
            onClick={() => onAddToCart(product)}
          >
            <CartPlusIcon className="h-5 w-5" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          data-testid={TEST_IDS.listing.productCardCompare(product.id)}
          onClick={() => onCompare(product)}
        >
          {VI_MESSAGES.catalog.compare}
        </Button>
      </div>
    </Card>
  );
}
