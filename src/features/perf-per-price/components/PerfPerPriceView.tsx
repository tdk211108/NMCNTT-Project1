import {
  Cpu,
  Crown,
  Database,
  Flame,
  Gem,
  Layers,
  Leaf,
  Maximize2,
  Minimize2,
  Scale,
  ShoppingCart,
  Tag,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { CpuIcon, GpuCardIcon } from '@/components/ui/Icons';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { HardwareAwardKey, HardwareAwardWinner } from '@/shared/types';
import type { usePerfPerPriceController } from '../usePerfPerPriceController';

export type PerfPerPriceViewProps = ReturnType<typeof usePerfPerPriceController>;

const AWARD_ICON_MAP: Record<HardwareAwardKey, LucideIcon> = {
  strongest: Crown,
  best_value: Flame,
  best_efficiency: Zap,
  lowest_power: Leaf,
  cheapest: Tag,
  most_expensive: Gem,
  most_cores: Cpu,
  largest_cache: Layers,
  most_vram: Database,
  most_compact: Minimize2,
  largest_gpu: Maximize2,
};

function AwardWinnerCard({
  winner,
  orderIndex,
  onAddToCart,
}: {
  winner: HardwareAwardWinner;
  orderIndex: number;
  onAddToCart: (item: { id: string; name: string; priceVnd: number }) => void;
}) {
  const isMulti = winner.awardCount > 1;
  const msgs = VI_MESSAGES.tools.perfPerPrice;

  return (
    <Card
      data-testid={TEST_IDS.ppp.awardCard(winner.id)}
      className={`flex flex-col justify-between gap-4 border-border-strong ${
        isMulti ? 'border-l-4 border-l-primary' : ''
      }`}
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
          <span className="font-mono text-xs font-bold tracking-widest text-accent-ink uppercase">
            {isMulti ? msgs.multiAwardTag(winner.awardCount) : msgs.singleAwardTag(orderIndex + 1)}
          </span>
          {isMulti ? (
            <Badge variant="accent">{msgs.multiAwardBadge(winner.awardCount)}</Badge>
          ) : (
            <Badge variant="default">{msgs.awardTitles[winner.awards[0].key]}</Badge>
          )}
        </div>

        <div className="flex items-start gap-3">
          <ProductImage
            src={winner.imageUrl}
            alt={winner.name}
            className="h-20 w-20 shrink-0 border border-border-strong bg-white object-contain p-1.5"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={vendorBadgeVariant(winner.vendor)}>
                {winner.vendor.toUpperCase()}
              </Badge>
              {winner.aibBrand ? <Badge variant="aib">{winner.aibBrand}</Badge> : null}
              {winner.isLimitedEdition ? (
                <Badge variant="accent">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
              ) : null}
            </div>

            {winner.specs.seriesName ? (
              <p className="font-mono text-xs text-ink-muted">{winner.specs.seriesName}</p>
            ) : null}

            <Link
              href={`/products/${winner.id}`}
              className="font-display text-base font-bold text-ink hover:text-accent-ink hover:underline"
            >
              {winner.name}
            </Link>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-accent-ink">
                {formatVnd(winner.priceVnd)}
              </span>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {winner.score.normalized !== null
                  ? `${formatNumberVi(winner.score.normalized, 1)} điểm (${formatNumberVi(winner.perfPerPrice, 2)}/tr)`
                  : formatNumberVi(winner.score.raw)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {winner.awards.map((award) => {
            const Icon = AWARD_ICON_MAP[award.key];
            return (
              <div
                key={`${winner.id}-${award.key}`}
                data-testid={TEST_IDS.ppp.awardBadge(winner.id, award.key)}
                className="flex flex-col gap-1 border border-border-strong bg-surface-subtle px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
                    <span>{msgs.awardTitles[award.key]}</span>
                  </span>
                  <span className="font-mono text-xs font-bold tabular-nums text-accent-ink">
                    {award.metricDisplay}
                  </span>
                </div>
                <p className="text-xs text-ink-muted">{msgs.awardDescriptions[award.key]}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-xs">
          {winner.category === 'cpu' ? (
            <>
              <div>
                <span className="text-ink-muted">Socket: </span>
                <span className="font-semibold text-ink">{winner.specs.socket}</span>
              </div>
              <div>
                <span className="text-ink-muted">Nhân/Luồng: </span>
                <span className="font-semibold text-ink">
                  {winner.specs.coresTotal}/{winner.specs.threadsTotal}
                </span>
              </div>
              <div>
                <span className="text-ink-muted">PSU Max: </span>
                <span className="font-semibold text-ink">{winner.specs.psuPowerW} W</span>
              </div>
              <div>
                <span className="text-ink-muted">L3 Cache: </span>
                <span className="font-semibold text-ink">
                  {formatNumberVi(
                    winner.specs.l3CacheMb ?? 0,
                    Number.isInteger(winner.specs.l3CacheMb ?? 0) ? 0 : 1,
                  )}{' '}
                  MB
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="text-ink-muted">VRAM: </span>
                <span className="font-semibold text-ink">{winner.specs.vramGb} GB</span>
              </div>
              <div>
                <span className="text-ink-muted">TBP: </span>
                <span className="font-semibold text-ink">{winner.specs.tbpW} W</span>
              </div>
              <div>
                <span className="text-ink-muted">Dài: </span>
                <span className="font-semibold text-ink">{winner.specs.lengthMm} mm</span>
              </div>
              <div>
                <span className="text-ink-muted">Độ dày: </span>
                <span className="font-semibold text-ink">
                  {formatNumberVi(winner.specs.slotThickness ?? 0, 1)} slot
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <Button
          variant="primary"
          size="sm"
          sfx="success"
          data-testid={TEST_IDS.ppp.awardAddCart(winner.id)}
          onClick={() => onAddToCart(winner)}
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{VI_MESSAGES.catalog.addToCart}</span>
        </Button>

        <Link href={`/products/${winner.id}`}>
          <Button variant="outline" size="sm">
            <span>{msgs.viewDetailAction}</span>
          </Button>
        </Link>

        <Link href={`/compare?ids=${winner.id}`}>
          <Button variant="outline" size="sm" cyber={false}>
            <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{msgs.compareAction}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function PerfPerPriceView({ state, actions }: PerfPerPriceViewProps) {
  const awards = state.data?.awards ?? [];
  const awardTotal = awards.reduce((sum, item) => sum + item.awardCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.tools.perfPerPrice.title, href: '/tools/perf-per-price' },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent-ink uppercase">
          <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>HALL OF FAME // HARDWARE AWARDS</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {VI_MESSAGES.tools.perfPerPrice.title}
        </h1>
        <p className="text-sm text-ink-muted">{VI_MESSAGES.tools.perfPerPrice.subtitle}</p>
      </div>

      <div
        role="tablist"
        aria-label={VI_MESSAGES.tools.perfPerPrice.categoryLabel}
        className="flex flex-wrap gap-2.5 border-b border-border pb-3"
      >
        <Button
          role="tab"
          aria-selected={state.category === 'cpu'}
          size="sm"
          cyber={false}
          sfx="toggle"
          variant={state.category === 'cpu' ? 'primary' : 'outline'}
          data-testid={TEST_IDS.ppp.category('cpu')}
          onClick={() => actions.onChangeCategory('cpu')}
        >
          <CpuIcon className="h-4 w-4" />
          <span>{VI_MESSAGES.nav.cpu}</span>
        </Button>
        <Button
          role="tab"
          aria-selected={state.category === 'gpu'}
          size="sm"
          cyber={false}
          sfx="toggle"
          variant={state.category === 'gpu' ? 'primary' : 'outline'}
          data-testid={TEST_IDS.ppp.category('gpu')}
          onClick={() => actions.onChangeCategory('gpu')}
        >
          <GpuCardIcon className="h-4 w-4" />
          <span>{VI_MESSAGES.nav.gpu}</span>
        </Button>
      </div>

      {state.isLoading ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : !state.data || awards.length === 0 ? (
        <EmptyState
          testId={TEST_IDS.ppp.empty}
          title={VI_MESSAGES.tools.perfPerPrice.emptyBudget}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div
            data-testid={TEST_IDS.ppp.awardSummary}
            className="flex flex-wrap items-center justify-between gap-2 border-l-4 border-primary bg-surface px-4 py-2.5 font-mono text-xs text-ink"
          >
            <span className="font-semibold">
              {VI_MESSAGES.tools.perfPerPrice.evaluatedSummary(
                awards.length,
                awardTotal,
                state.data.totalEvaluated,
              )}
            </span>
            <Badge variant="default">
              {state.category === 'cpu' ? VI_MESSAGES.nav.cpu : VI_MESSAGES.nav.gpu}
            </Badge>
          </div>

          <div
            data-testid={TEST_IDS.ppp.awardsGrid}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
          >
            {awards.map((winner, index) => (
              <AwardWinnerCard
                key={winner.id}
                winner={winner}
                orderIndex={index}
                onAddToCart={actions.onAddToCart}
              />
            ))}
          </div>
        </div>
      )}

      {state.data?.notes.length ? (
        <Card className="flex flex-col gap-2 bg-surface-subtle text-xs text-ink-muted">
          {state.data.notes.map((note, idx) => (
            <p key={idx}>{note}</p>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
