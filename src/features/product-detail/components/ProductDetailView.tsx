import Link from 'next/link';
import { Badge, Card, VendorBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { CartPlusIcon, SolarIcon } from '@/components/ui/Icons';
import { ProductImage } from '@/components/ui/ProductImage';
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
        <Link href={`/${detail.category}`} className="font-medium transition-colors hover:text-primary">
          {detail.category === 'cpu' ? VI_MESSAGES.nav.cpu : VI_MESSAGES.nav.gpu}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-ink">{detail.name}</span>
      </div>

      <Card className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[18px] bg-white p-3 shadow-sm ring-1 ring-white/80 dark:ring-emerald-300/20 md:aspect-auto md:h-full md:min-h-[420px]">
            <ProductImage
              src={detail.imageUrl}
              alt={detail.name}
              zoomOnHover
              zoomScale={1.7}
              className="h-full max-h-[440px] w-full object-contain"
            />
          </div>
          <p className="text-center text-xs text-ink-muted">{VI_MESSAGES.catalog.imageZoomHint}</p>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <VendorBadge vendor={detail.vendor} />
              {detail.aibBrand ? <Badge variant="accent">{detail.aibBrand}</Badge> : null}
              {detail.series ? <Badge>{detail.series.name}</Badge> : null}
              {detail.isLimitedEdition ? (
                <Badge variant="warning">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
              ) : null}
            </div>

            <h1 className="text-2xl leading-tight font-bold text-ink sm:text-3xl">{detail.name}</h1>

            <p className="font-mono text-3xl font-bold tabular-nums text-primary">
              {formatVnd(detail.priceVnd)}
            </p>

            <dl className="grid grid-cols-1 gap-3 border-y border-border/70 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailStockLabel}</dt>
                <dd className="mt-0.5 font-semibold text-success">{VI_MESSAGES.common.inStock}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailWarrantyLabel}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{VI_MESSAGES.common.warranty}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailPackagingLabel}</dt>
                <dd className="mt-0.5 font-semibold text-ink">{VI_MESSAGES.common.packagingFullBox}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">{VI_MESSAGES.catalog.detailScoreLabel}</dt>
                <dd className="mt-0.5 font-mono font-semibold tabular-nums text-ink">
                  {detail.score.normalized !== null
                    ? `${formatNumberVi(detail.score.normalized, 1)} (${formatNumberVi(detail.score.raw)} ${detail.score.source})`
                    : VI_MESSAGES.common.noData}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                data-testid={TEST_IDS.detail.buyNow}
                onClick={actions.onBuyNow}
              >
                {VI_MESSAGES.catalog.buyNow}
              </Button>
              <Button
                variant="outline"
                size="lg"
                aria-label={VI_MESSAGES.catalog.addToCartAria(detail.name)}
                title={VI_MESSAGES.catalog.addToCart}
                className="h-12 w-12 shrink-0 rounded-full p-0"
                data-testid={TEST_IDS.detail.addToCart}
                onClick={actions.onAddToCart}
              >
                <CartPlusIcon className="h-5 w-5 text-primary" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                data-testid={TEST_IDS.detail.compareThis}
                onClick={actions.onCompare}
              >
                <SolarIcon name="scale-bold-duotone" className="h-4 w-4 text-primary" withShadow={false} />
                <span>{VI_MESSAGES.catalog.compareThisModel}</span>
              </Button>
              <Button
                variant="secondary"
                data-testid={TEST_IDS.detail.calcPsu}
                onClick={actions.onCalculatePsu}
              >
                <SolarIcon name="bolt-bold-duotone" className="h-4 w-4 text-primary" withShadow={false} />
                <span>{VI_MESSAGES.catalog.calculatePsu}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4">
        {detail.specGroups.map((group) => (
          <Card key={group.key} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-ink">{group.title}</h2>
            <ResponsiveTableWrapper label={group.title}>
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.key} className="border-b border-border/60 last:border-b-0">
                      <th className="w-2/5 bg-surface-subtle/80 px-4 py-2.5 font-medium text-ink-muted">
                        {item.label}
                      </th>
                      <td className="px-4 py-2.5 font-medium text-ink">{item.value}</td>
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
