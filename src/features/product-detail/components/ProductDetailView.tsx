import { Gauge, Scale, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AnimatedCartButton } from '@/components/ui/AnimatedCartButton';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductImage, ZoomableImageFrame } from '@/components/ui/ProductImage';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useProductDetailController } from '../useProductDetailController';

export type ProductDetailViewProps = ReturnType<typeof useProductDetailController>;

export function ProductDetailView({ state, actions }: ProductDetailViewProps) {
  if (state.isLoading) {
    return <Spinner />;
  }

  if (state.errorMessage || !state.detail) {
    return (
      <EmptyState
        title={state.errorMessage ?? VI_MESSAGES.catalog.productNotFound}
        action={
          <Link href="/cpu">
            <Button variant="secondary">{VI_MESSAGES.common.backToStore}</Button>
          </Link>
        }
      />
    );
  }

  const { detail } = state;
  const upgradeHref =
    detail.category === 'cpu'
      ? `/tools/upgrade?category=cpu&current=${encodeURIComponent(`store:${detail.id}`)}`
      : detail.series
        ? `/tools/upgrade?category=gpu&current=${encodeURIComponent(detail.series.id)}`
        : null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          {
            label: detail.category === 'cpu' ? VI_MESSAGES.nav.cpu : VI_MESSAGES.nav.gpu,
            href: `/${detail.category}`,
          },
          { label: detail.name, href: `/products/${detail.id}` },
        ]}
      />

      <Card className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ZoomableImageFrame
          zoomScale={1.75}
          className="flex aspect-square w-full items-center justify-center rounded-card border-2 border-border-strong bg-white md:aspect-auto md:h-full md:min-h-[420px]"
        >
          <ProductImage
            src={detail.imageUrl}
            alt={detail.name}
            loading="eager"
            className="h-full max-h-[460px] w-full object-contain p-2"
          />
        </ZoomableImageFrame>

        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={vendorBadgeVariant(detail.vendor)}>
                {detail.vendor.toUpperCase()}
              </Badge>
              {detail.aibBrand ? <Badge variant="aib">{detail.aibBrand}</Badge> : null}
              {detail.series ? <Badge>{detail.series.name}</Badge> : null}
            </div>

            <h1 className="font-display text-2xl font-bold text-ink">{detail.name}</h1>

            <p className="font-mono text-3xl font-bold tabular-nums text-accent-ink">
              {formatVnd(detail.priceVnd)}
            </p>

            <dl className="grid grid-cols-1 gap-2 border-y-2 border-border py-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailStockLabel}</dt>
                <dd className="font-semibold text-success">{VI_MESSAGES.common.inStock}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailWarrantyLabel}</dt>
                <dd className="font-medium text-ink">{VI_MESSAGES.common.warranty}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailPackagingLabel}</dt>
                <dd className="font-medium text-ink">{VI_MESSAGES.common.packagingFullBox}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailScoreLabel}</dt>
                <dd className="font-mono font-medium tabular-nums text-ink">
                  {detail.score.normalized !== null
                    ? `${formatNumberVi(detail.score.normalized, 1)} (${formatNumberVi(detail.score.raw)} ${detail.score.source})`
                    : VI_MESSAGES.common.noData}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                data-testid={TEST_IDS.detail.buyNow}
                onClick={actions.onBuyNow}
              >
                {VI_MESSAGES.catalog.buyNow}
              </Button>
              <AnimatedCartButton
                ariaLabel={VI_MESSAGES.catalog.addToCartAria(detail.name)}
                title={VI_MESSAGES.catalog.addToCart}
                size="detail"
                testId={TEST_IDS.detail.addToCart}
                onAdd={actions.onAddToCart}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                data-testid={TEST_IDS.detail.compareThis}
                onClick={actions.onCompare}
              >
                <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{VI_MESSAGES.catalog.compareThisModel}</span>
              </Button>
              <Button
                variant="outline"
                data-testid={TEST_IDS.detail.calcPsu}
                onClick={actions.onCalculatePsu}
              >
                <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{VI_MESSAGES.catalog.calculatePsu}</span>
              </Button>
            </div>

            {upgradeHref ? (
              <Link href={upgradeHref} data-testid={TEST_IDS.detail.upgradeAdvisorLink}>
                <Button variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{VI_MESSAGES.catalog.upgradeFromThisModel}</span>
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {detail.specGroups.map((group) => (
          <Card key={group.key} className="flex flex-col gap-3">
            <h2 className="font-display text-lg font-bold text-ink">{group.title}</h2>
            <ResponsiveTableWrapper label={group.title}>
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.key} className="border-b border-border last:border-b-0">
                      <th className="w-2/5 bg-surface-subtle px-3 py-2 font-medium text-ink-muted">
                        {item.label}
                      </th>
                      <td className="px-3 py-2 font-mono tabular-nums text-ink">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrapper>
          </Card>
        ))}
      </div>
    </div>
  );
}
