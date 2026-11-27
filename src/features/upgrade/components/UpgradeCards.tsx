import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  Scale,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { UpgradeCpuItem, UpgradeGpuItem, UpgradeWarning } from '@/shared/types';

function formatWarningMessage(w: UpgradeWarning): string {
  const msgs = VI_MESSAGES.tools.upgrade.warnings;
  switch (w.code) {
    case 'socket_change':
      return msgs.socket_change(w.fromLabel ?? '', w.toLabel ?? '');
    case 'ram_ddr5_required':
      return msgs.ram_ddr5_required;
    case 'ram_ddr4_or_ddr5':
      return msgs.ram_ddr4_or_ddr5;
    case 'cpu_power_increase':
      return msgs.cpu_power_increase(w.deltaValue ?? 0, w.fromWatt ?? 0, w.toWatt ?? 0);
    case 'gpu_tbp_high':
      return msgs.gpu_tbp_high(w.deltaValue ?? 0, w.fromWatt ?? 0, w.toWatt ?? 0);
    case 'gpu_tbp_moderate':
      return msgs.gpu_tbp_moderate(w.deltaValue ?? 0);
    case 'gpu_large_size':
      return msgs.gpu_large_size(
        w.lengthMm ?? 0,
        formatNumberVi(w.slotThickness ?? 0, 1),
      );
    case 'gpu_vram_decrease':
      return msgs.gpu_vram_decrease(w.fromVramGb ?? 0, w.toVramGb ?? 0);
    case 'gpu_vram_increase':
      return msgs.gpu_vram_increase(w.fromVramGb ?? 0, w.toVramGb ?? 0, w.deltaValue ?? 0);
  }
}

function WarningRow({ itemId, warning }: { itemId: string; warning: UpgradeWarning }) {
  const text = formatWarningMessage(warning);

  if (warning.severity === 'high') {
    return (
      <div
        data-testid={TEST_IDS.upgrade.warning(itemId, warning.code)}
        className="flex items-start gap-2 border border-danger/70 bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
      >
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </div>
    );
  }

  if (warning.severity === 'medium') {
    return (
      <div
        data-testid={TEST_IDS.upgrade.warning(itemId, warning.code)}
        className="flex items-start gap-2 border border-warning/70 bg-warning/15 px-3 py-2 text-xs text-ink"
      >
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
        <span>{text}</span>
      </div>
    );
  }

  if (warning.severity === 'positive') {
    return (
      <div
        data-testid={TEST_IDS.upgrade.warning(itemId, warning.code)}
        className="flex items-start gap-2 border border-success/60 bg-highlight px-3 py-2 text-xs font-medium text-highlight-fg"
      >
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div
      data-testid={TEST_IDS.upgrade.warning(itemId, warning.code)}
      className="flex items-start gap-2 border border-border-strong bg-surface-subtle px-3 py-2 text-xs text-ink"
    >
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

export function UpgradeGroupHeader({
  tone,
  tag,
  statusLabel,
  count,
  title,
  description,
  notice,
}: {
  tone: 'same_socket' | 'platform_swap' | 'gpu';
  tag: string;
  statusLabel: string;
  count: number;
  title: string;
  description: string;
  notice?: string;
}) {
  const accentBorderClass =
    tone === 'same_socket' ? 'border-l-success' : 'border-l-primary';
  const tagColorClass =
    tone === 'same_socket' ? 'text-success' : 'text-accent-ink';
  const statusVariant =
    tone === 'same_socket' ? 'success' : tone === 'platform_swap' ? 'warning' : 'default';

  return (
    <div
      className={`mtx-shadow-sm border-2 border-border-strong border-l-4 bg-surface p-4 ${accentBorderClass}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-mono text-xs font-bold tracking-widest uppercase ${tagColorClass}`}>
            {tag}
          </span>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>
        <Badge variant="default">{VI_MESSAGES.tools.upgrade.topResultsBadge(count)}</Badge>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <h2 className="font-display text-xl font-bold tracking-wide text-ink uppercase">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">{description}</p>
      </div>

      {notice ? (
        <div className="mt-3 flex items-start gap-2 border border-border bg-surface-subtle px-3 py-2 text-xs text-ink">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-ink" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}
    </div>
  );
}

function UpgradeCardActions({
  item,
  onAddToCart,
  seriesId,
  aibVariantsHref,
}: {
  item: {
    id: string;
    name: string;
    priceVnd: number;
    psuHref: string;
    compareHref: string | null;
  };
  onAddToCart: (item: { id: string; name: string; priceVnd: number }) => void;
  seriesId?: string;
  aibVariantsHref?: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 pt-1">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="primary"
          size="sm"
          sfx="success"
          data-testid={TEST_IDS.upgrade.addCart(item.id)}
          onClick={() => onAddToCart(item)}
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{VI_MESSAGES.catalog.addToCart}</span>
        </Button>

        <Link href={`/products/${item.id}`}>
          <Button variant="outline" size="sm">
            <span>{VI_MESSAGES.tools.upgrade.viewDetailAction}</span>
          </Button>
        </Link>
      </div>

      {/* Keep PSU check and direct compare strictly paired on a single row down to 360px. */}
      <div className={`grid gap-2 ${item.compareHref ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Link
          href={item.psuHref}
          data-testid={TEST_IDS.upgrade.psuLink(item.id)}
          className="block min-w-0"
        >
          <Button variant="outline" size="xs" cyber={false} className="min-h-10 w-full min-w-0 whitespace-nowrap sm:min-h-9">
            <Gauge className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.tools.upgrade.checkPsuAction}</span>
          </Button>
        </Link>

        {item.compareHref ? (
          <Link
            href={item.compareHref}
            data-testid={TEST_IDS.upgrade.compareLink(item.id)}
            className="block min-w-0"
          >
            <Button
              variant="outline"
              size="xs"
              cyber={false}
              className="min-h-10 w-full min-w-0 whitespace-nowrap sm:min-h-9"
            >
              <Scale className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.tools.upgrade.compareDirectAction}</span>
            </Button>
          </Link>
        ) : null}
      </div>

      {aibVariantsHref && seriesId ? (
        <Link
          href={aibVariantsHref}
          data-testid={TEST_IDS.upgrade.aibVariantsLink(seriesId)}
          className="block w-full"
        >
          <Button variant="outline" size="sm" cyber={false} className="w-full">
            <span>{VI_MESSAGES.tools.upgrade.viewAibVariantsAction}</span>
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

export function CpuUpgradeCard({
  item,
  onAddToCart,
}: {
  item: UpgradeCpuItem;
  onAddToCart: (item: { id: string; name: string; priceVnd: number }) => void;
}) {
  return (
    <Card
      data-testid={TEST_IDS.upgrade.card(item.id)}
      className="flex flex-col justify-between gap-4 border-border-strong"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <ProductImage
            src={item.imageUrl}
            alt={item.name}
            className="h-20 w-20 shrink-0 border border-border-strong bg-white object-contain p-1.5"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={vendorBadgeVariant(item.vendor)}>
                {item.vendor.toUpperCase()}
              </Badge>
              {item.upliftPct !== null ? (
                <Badge variant="accent" data-testid={TEST_IDS.upgrade.uplift(item.id)}>
                  {VI_MESSAGES.tools.upgrade.upliftBadge(item.upliftPct)}
                </Badge>
              ) : null}
              {item.sameSocket ? (
                <Badge variant="success">{VI_MESSAGES.tools.upgrade.sameSocketChipLabel}</Badge>
              ) : null}
            </div>

            <Link
              href={`/products/${item.id}`}
              className="font-display text-base font-bold text-ink hover:text-accent-ink hover:underline"
            >
              {item.name}
            </Link>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-accent-ink">
                {formatVnd(item.priceVnd)}
              </span>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {item.score.normalized !== null
                  ? VI_MESSAGES.tools.specs.scoreAndPerfPerPrice(
                      formatNumberVi(item.score.normalized, 1),
                      formatNumberVi(item.perfPerPrice, 2),
                    )
                  : formatNumberVi(item.score.raw)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-xs">
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.socket}: </span>
            <span className="font-semibold text-ink">{item.socket}</span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.coresThreads}: </span>
            <span className="font-semibold text-ink">
              {item.coresTotal}/{item.threadsTotal}
            </span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.psuMax}: </span>
            <span className="font-semibold text-ink">{item.psuPowerW} W</span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.ram}: </span>
            <span className="font-semibold text-ink">{item.ramSupport}</span>
          </div>
        </div>

        {item.warnings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {item.warnings.map((w) => (
              <WarningRow key={`${item.id}-${w.code}`} itemId={item.id} warning={w} />
            ))}
          </div>
        ) : null}
      </div>

      <UpgradeCardActions item={item} onAddToCart={onAddToCart} />
    </Card>
  );
}

export function GpuUpgradeCard({
  item,
  onAddToCart,
}: {
  item: UpgradeGpuItem;
  onAddToCart: (item: { id: string; name: string; priceVnd: number }) => void;
}) {
  return (
    <Card
      data-testid={TEST_IDS.upgrade.card(item.id)}
      className="flex flex-col justify-between gap-4 border-border-strong"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <ProductImage
            src={item.imageUrl}
            alt={item.name}
            className="h-20 w-20 shrink-0 border border-border-strong bg-white object-contain p-1.5"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={vendorBadgeVariant(item.vendor)}>
                {item.vendor.toUpperCase()}
              </Badge>
              <Badge variant="aib">{item.aibBrand}</Badge>
              {item.upliftPct !== null ? (
                <Badge variant="accent" data-testid={TEST_IDS.upgrade.uplift(item.id)}>
                  {VI_MESSAGES.tools.upgrade.upliftBadge(item.upliftPct)}
                </Badge>
              ) : null}
            </div>

            <p className="font-mono text-xs text-ink-muted">{item.seriesName}</p>
            <Link
              href={`/products/${item.id}`}
              className="font-display text-base font-bold text-ink hover:text-accent-ink hover:underline"
            >
              {item.name}
            </Link>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xl font-bold tabular-nums text-accent-ink">
                {formatVnd(item.priceVnd)}
              </span>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {item.score.normalized !== null
                  ? VI_MESSAGES.tools.specs.scoreAndPerfPerPrice(
                      formatNumberVi(item.score.normalized, 1),
                      formatNumberVi(item.perfPerPrice, 2),
                    )
                  : formatNumberVi(item.score.raw)}
              </span>
            </div>

            <p className="font-mono text-xs text-ink-muted">
              {VI_MESSAGES.tools.upgrade.aibVariantsSummary(
                item.variantCount,
                formatVnd(item.priceVnd),
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-xs">
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.vram}: </span>
            <span className="font-semibold text-ink">{item.vramGb} GB</span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.tbp}: </span>
            <span className="font-semibold text-ink">{item.tbpW} W</span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.length}: </span>
            <span className="font-semibold text-ink">{item.lengthMm} mm</span>
          </div>
          <div>
            <span className="text-ink-muted">{VI_MESSAGES.tools.specs.thickness}: </span>
            <span className="font-semibold text-ink">
              {formatNumberVi(item.slotThickness, 1)} {VI_MESSAGES.tools.specs.slotUnit}
            </span>
          </div>
        </div>

        {item.warnings.length > 0 ? (
          <div className="flex flex-col gap-2">
            {item.warnings.map((w) => (
              <WarningRow key={`${item.id}-${w.code}`} itemId={item.id} warning={w} />
            ))}
          </div>
        ) : null}
      </div>

      <UpgradeCardActions
        item={item}
        onAddToCart={onAddToCart}
        seriesId={item.seriesId}
        aibVariantsHref={item.aibVariantsHref}
      />
    </Card>
  );
}
