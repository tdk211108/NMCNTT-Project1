import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  Scale,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { ComboboxSelect, type ComboboxSelectOption } from '@/components/ui/ComboboxSelect';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { CpuIcon, GpuCardIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { SearchableSelect, type SearchableSelectGroup } from '@/components/ui/SearchableSelect';
import { formatNumberVi, formatVnd } from '@/lib/format';
import {
  UPGRADE_CPU_BUDGET_PRESETS_VND,
  UPGRADE_GPU_BUDGET_PRESETS_VND,
} from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type {
  UpgradeCpuItem,
  UpgradeCpuOption,
  UpgradeGpuItem,
  UpgradeGpuOption,
  UpgradeSort,
  UpgradeWarning,
} from '@/shared/types';
import type { useUpgradeAdvisorController } from '../useUpgradeAdvisorController';

export type UpgradeAdvisorViewProps = ReturnType<typeof useUpgradeAdvisorController>;

const SORT_OPTIONS: readonly ComboboxSelectOption<UpgradeSort>[] = [
  { value: 'recommended', label: VI_MESSAGES.tools.upgrade.sortOptions.recommended },
  { value: 'uplift_desc', label: VI_MESSAGES.tools.upgrade.sortOptions.uplift_desc },
  {
    value: 'perf_per_price_desc',
    label: VI_MESSAGES.tools.upgrade.sortOptions.perf_per_price_desc,
  },
  { value: 'price_asc', label: VI_MESSAGES.tools.upgrade.sortOptions.price_asc },
];

function buildCpuSelectGroups(
  retail: readonly UpgradeCpuOption[],
  legacy: readonly UpgradeCpuOption[],
): SearchableSelectGroup[] {
  return [
    ...(retail.length > 0
      ? [
          {
            id: 'retail-cpu',
            label: VI_MESSAGES.tools.psu.groupRetail,
            options: retail.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.socket ?? item.vendor.toUpperCase(),
              keywords: `${item.vendor} ${item.socket ?? ''}`,
            })),
          },
        ]
      : []),
    ...(legacy.length > 0
      ? [
          {
            id: 'legacy-cpu',
            label: VI_MESSAGES.tools.psu.groupLegacy,
            options: legacy.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.socket
                ? `${item.socket}${item.hasPassmark ? '' : ' · Chưa có điểm'}`
                : item.hasPassmark
                  ? item.vendor.toUpperCase()
                  : 'Chưa có điểm',
              keywords: `${item.vendor} ${item.socket ?? ''}`,
            })),
          },
        ]
      : []),
  ];
}

function buildGpuSelectGroups(
  retail: readonly UpgradeGpuOption[],
  legacy: readonly UpgradeGpuOption[],
): SearchableSelectGroup[] {
  return [
    ...(retail.length > 0
      ? [
          {
            id: 'retail-gpu',
            label: VI_MESSAGES.tools.psu.groupRetail,
            options: retail.map((item) => ({
              value: item.id,
              label: item.name,
              meta: `${item.vramGb} GB VRAM`,
              keywords: `${item.vendor} ${item.vramGb}GB`,
            })),
          },
        ]
      : []),
    ...(legacy.length > 0
      ? [
          {
            id: 'legacy-gpu',
            label: VI_MESSAGES.tools.psu.groupLegacy,
            options: legacy.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.hasPassmark
                ? `${item.vramGb} GB VRAM`
                : `${item.vramGb} GB · Chưa có điểm`,
              keywords: `${item.vendor} ${item.vramGb}GB`,
            })),
          },
        ]
      : []),
  ];
}

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

function UpgradeGroupHeader({
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

function CpuUpgradeCard({
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
                  ? `${formatNumberVi(item.score.normalized, 1)} điểm (${formatNumberVi(item.perfPerPrice, 2)}/tr)`
                  : formatNumberVi(item.score.raw)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-y border-border py-2 font-mono text-xs">
          <div>
            <span className="text-ink-muted">Socket: </span>
            <span className="font-semibold text-ink">{item.socket}</span>
          </div>
          <div>
            <span className="text-ink-muted">Nhân/Luồng: </span>
            <span className="font-semibold text-ink">
              {item.coresTotal}/{item.threadsTotal}
            </span>
          </div>
          <div>
            <span className="text-ink-muted">PSU Max: </span>
            <span className="font-semibold text-ink">{item.psuPowerW} W</span>
          </div>
          <div>
            <span className="text-ink-muted">RAM: </span>
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

      <div className="flex flex-wrap items-center gap-3 pt-1">
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

        <Link href={item.psuHref} data-testid={TEST_IDS.upgrade.psuLink(item.id)}>
          <Button variant="outline" size="sm" cyber={false}>
            <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.tools.upgrade.checkPsuAction}</span>
          </Button>
        </Link>

        {item.compareHref ? (
          <Link href={item.compareHref} data-testid={TEST_IDS.upgrade.compareLink(item.id)}>
            <Button variant="outline" size="sm" cyber={false}>
              <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.tools.upgrade.compareDirectAction}</span>
            </Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}

function GpuUpgradeCard({
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
                  ? `${formatNumberVi(item.score.normalized, 1)} điểm (${formatNumberVi(item.perfPerPrice, 2)}/tr)`
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
            <span className="text-ink-muted">VRAM: </span>
            <span className="font-semibold text-ink">{item.vramGb} GB</span>
          </div>
          <div>
            <span className="text-ink-muted">TBP: </span>
            <span className="font-semibold text-ink">{item.tbpW} W</span>
          </div>
          <div>
            <span className="text-ink-muted">Dài: </span>
            <span className="font-semibold text-ink">{item.lengthMm} mm</span>
          </div>
          <div>
            <span className="text-ink-muted">Độ dày: </span>
            <span className="font-semibold text-ink">
              {formatNumberVi(item.slotThickness, 1)} slot
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

      <div className="flex flex-wrap items-center gap-3 pt-1">
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

        <Link href={item.psuHref} data-testid={TEST_IDS.upgrade.psuLink(item.id)}>
          <Button variant="outline" size="sm" cyber={false}>
            <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.tools.upgrade.checkPsuAction}</span>
          </Button>
        </Link>

        {item.compareHref ? (
          <Link href={item.compareHref} data-testid={TEST_IDS.upgrade.compareLink(item.id)}>
            <Button variant="outline" size="sm" cyber={false}>
              <Scale className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.tools.upgrade.compareDirectAction}</span>
            </Button>
          </Link>
        ) : null}

        <Link
          href={item.aibVariantsHref}
          data-testid={TEST_IDS.upgrade.aibVariantsLink(item.seriesId)}
        >
          <Button variant="outline" size="sm" cyber={false}>
            <span>{VI_MESSAGES.tools.upgrade.viewAibVariantsAction}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function UpgradeAdvisorView({ state, actions }: UpgradeAdvisorViewProps) {
  const presets =
    state.category === 'cpu' ? UPGRADE_CPU_BUDGET_PRESETS_VND : UPGRADE_GPU_BUDGET_PRESETS_VND;
  const selectGroups =
    state.category === 'cpu'
      ? buildCpuSelectGroups(state.retailCpuOptions, state.legacyCpuOptions)
      : buildGpuSelectGroups(state.retailGpuOptions, state.legacyGpuOptions);

  const hasAnyResults = state.data
    ? state.data.sameSocketCpus.length > 0 ||
      state.data.platformSwapCpus.length > 0 ||
      state.data.gpus.length > 0
    : false;

  const activeNotes = state.data?.notes ?? [
    VI_MESSAGES.tools.disclaimers.passmark,
    VI_MESSAGES.tools.disclaimers.estimation,
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.tools.upgrade.title, href: '/tools/upgrade' },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent-ink uppercase">
          <TrendingUp className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>ADVISOR // UPGRADE PATH</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          {VI_MESSAGES.tools.upgrade.title}
        </h1>
        <p className="text-sm text-ink-muted">{VI_MESSAGES.tools.upgrade.subtitle}</p>
      </div>

      {state.isLoadingOptions ? (
        <Spinner />
      ) : state.optionsErrorMessage ? (
        <EmptyState
          title={state.optionsErrorMessage}
          action={
            <Button variant="primary" onClick={actions.onRetryOptions}>
              {VI_MESSAGES.common.retry}
            </Button>
          }
        />
      ) : (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              actions.onSubmit();
            }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-ink">
                {VI_MESSAGES.tools.upgrade.categoryLabel}:
              </span>
              <Button
                size="sm"
                cyber={false}
                sfx="toggle"
                variant={state.category === 'cpu' ? 'primary' : 'outline'}
                data-testid={TEST_IDS.upgrade.categoryCpu}
                onClick={() => actions.onChangeCategory('cpu')}
              >
                <CpuIcon className="h-4 w-4" />
                <span>{VI_MESSAGES.nav.cpu}</span>
              </Button>
              <Button
                size="sm"
                cyber={false}
                sfx="toggle"
                variant={state.category === 'gpu' ? 'primary' : 'outline'}
                data-testid={TEST_IDS.upgrade.categoryGpu}
                onClick={() => actions.onChangeCategory('gpu')}
              >
                <GpuCardIcon className="h-4 w-4" />
                <span>{VI_MESSAGES.nav.gpu}</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SearchableSelect
                required
                label={VI_MESSAGES.tools.upgrade.currentLabel}
                value={state.currentId}
                groups={selectGroups}
                placeholder={
                  state.category === 'cpu'
                    ? VI_MESSAGES.tools.upgrade.currentCpuPlaceholder
                    : VI_MESSAGES.tools.upgrade.currentGpuPlaceholder
                }
                triggerTestId={TEST_IDS.upgrade.currentSelect}
                searchTestId={TEST_IDS.upgrade.currentSearch}
                optionTestId={TEST_IDS.upgrade.currentOption}
                onChange={actions.onSelectCurrent}
              />

              <div className="flex flex-col gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  label={VI_MESSAGES.tools.upgrade.budgetLabel}
                  value={state.budgetInput}
                  error={state.budgetError ?? undefined}
                  data-testid={TEST_IDS.upgrade.budgetInput}
                  onChange={(e) => actions.onChangeBudgetInput(e.target.value)}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-ink-muted">
                    {VI_MESSAGES.tools.upgrade.budgetPresetsLabel}:
                  </span>
                  {presets.map((amount) => (
                    <Button
                      key={amount}
                      size="sm"
                      cyber={false}
                      sfx="toggle"
                      variant={state.budgetInput === String(amount) ? 'primary' : 'outline'}
                      onClick={() => actions.onSelectBudgetPreset(amount)}
                    >
                      {Math.round(amount / 1_000_000)} triệu
                    </Button>
                  ))}
                  {state.budgetInput ? (
                    <Button size="sm" cyber={false} variant="ghost" onClick={actions.onClearBudget}>
                      {VI_MESSAGES.common.reset}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 lg:grid-cols-2">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink">
                    {VI_MESSAGES.tools.upgrade.vendorLabel}:
                  </span>
                  {state.availableVendors.map((vendor) => {
                    const active = state.selectedVendors.includes(vendor);
                    return (
                      <Button
                        key={vendor}
                        size="sm"
                        cyber={false}
                        sfx="toggle"
                        variant={active ? 'primary' : 'outline'}
                        onClick={() => actions.onToggleVendor(vendor)}
                      >
                        {vendor.toUpperCase()}
                      </Button>
                    );
                  })}
                </div>

                {state.category === 'cpu' ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.sameSocketOnly}
                        aria-label={VI_MESSAGES.tools.upgrade.sameSocketLabel}
                        disabled={!state.sameSocketAvailable}
                        data-sfx="toggle"
                        data-testid={TEST_IDS.upgrade.sameSocketToggle}
                        onClick={actions.onToggleSameSocket}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center border-2 border-border-strong p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:opacity-45 ${
                          state.sameSocketOnly ? 'bg-primary' : 'bg-surface-subtle'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`inline-block h-4 w-4 bg-white transition-transform ${
                            state.sameSocketOnly ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className="text-sm font-medium text-ink">
                        {VI_MESSAGES.tools.upgrade.sameSocketLabel}
                      </span>
                    </div>
                    {state.currentId && !state.sameSocketAvailable ? (
                      <p className="text-xs text-ink-muted">
                        {VI_MESSAGES.tools.upgrade.sameSocketUnavailableHint}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="sm:max-w-xs">
                <ComboboxSelect
                  label={VI_MESSAGES.tools.upgrade.sortLabel}
                  value={state.sort}
                  options={SORT_OPTIONS}
                  testId={TEST_IDS.upgrade.sortSelect}
                  onChange={actions.onChangeSort}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={!state.currentId}
                data-testid={TEST_IDS.upgrade.submit}
              >
                {VI_MESSAGES.tools.upgrade.submitLabel}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!state.currentId ? (
        <EmptyState title={VI_MESSAGES.tools.upgrade.promptPickCurrent} />
      ) : state.isLoadingRecommendations ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : state.data ? (
        <>
          <Card
            data-testid={TEST_IDS.upgrade.currentSummary}
            className="flex flex-col gap-3 border-border-strong bg-surface-elevated"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold tracking-wider text-ink-muted uppercase">
                {VI_MESSAGES.tools.upgrade.currentSummaryHeading}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={vendorBadgeVariant(state.data.current.vendor)}>
                  {state.data.current.vendor.toUpperCase()}
                </Badge>
                <Badge variant={state.data.current.source === 'store' ? 'success' : 'demo'}>
                  {state.data.current.source === 'store'
                    ? VI_MESSAGES.tools.upgrade.sourceStoreBadge
                    : VI_MESSAGES.tools.upgrade.sourceLegacyBadge}
                </Badge>
                {!state.data.current.hasPassmark ? (
                  <Badge variant="warning">
                    {VI_MESSAGES.tools.upgrade.missingPassmarkBadge}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-display text-lg font-bold text-ink">{state.data.current.name}</p>
              <p className="font-mono text-xs tabular-nums text-ink-muted">
                {state.data.current.passmarkRaw !== null
                  ? `PassMark: ${formatNumberVi(state.data.current.passmarkRaw)}`
                  : VI_MESSAGES.tools.upgrade.missingPassmarkBadge}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-ink-muted">
              {state.data.category === 'cpu' ? (
                <>
                  <span>Socket: {state.data.current.socket ?? VI_MESSAGES.common.noData}</span>
                  <span>
                    Nhân/Luồng:{' '}
                    {state.data.current.coresTotal && state.data.current.threadsTotal
                      ? `${state.data.current.coresTotal}/${state.data.current.threadsTotal}`
                      : VI_MESSAGES.common.noData}
                  </span>
                  <span>
                    PSU Max:{' '}
                    {state.data.current.psuPowerW !== null
                      ? `${state.data.current.psuPowerW} W`
                      : VI_MESSAGES.common.noData}
                  </span>
                </>
              ) : (
                <>
                  <span>VRAM: {state.data.current.vramGb ?? 0} GB</span>
                  <span>TBP: {state.data.current.tbpW ?? 0} W</span>
                </>
              )}
            </div>
          </Card>

          {!state.data.current.hasPassmark ? (
            <Card className="border-warning/70 bg-warning/10 text-sm text-ink">
              {VI_MESSAGES.tools.upgrade.missingPassmarkNote}
            </Card>
          ) : null}

          {state.data.isTopTier ? (
            <Card className="flex flex-col gap-1.5 border-success/60 bg-highlight text-highlight-fg">
              <p className="font-display text-base font-bold">
                {VI_MESSAGES.tools.upgrade.topTierTitle}
              </p>
              <p className="text-sm">{VI_MESSAGES.tools.upgrade.topTierDesc}</p>
            </Card>
          ) : !hasAnyResults ? (
            <Card className="flex flex-col gap-3 border-warning/70 bg-surface-subtle">
              <p className="font-display text-base font-bold text-ink">
                {VI_MESSAGES.tools.upgrade.budgetTooLowTitle}
              </p>
              <p className="text-sm text-ink-muted">
                {state.data.minUpgradePriceVnd !== null
                  ? VI_MESSAGES.tools.upgrade.budgetTooLowDesc(
                      formatVnd(state.data.minUpgradePriceVnd),
                    )
                  : VI_MESSAGES.tools.upgrade.emptyFilteredDesc}
              </p>
              {state.budgetInput ? (
                <div>
                  <Button size="sm" variant="outline" cyber={false} onClick={actions.onClearBudget}>
                    {VI_MESSAGES.tools.upgrade.clearBudgetButton}
                  </Button>
                </div>
              ) : null}
            </Card>
          ) : state.data.category === 'cpu' ? (
            <div className="flex flex-col gap-6">
              {state.data.sameSocketCpus.length > 0 ? (
                <section
                  data-testid={TEST_IDS.upgrade.groupSameSocket}
                  className="flex flex-col gap-4"
                >
                  <UpgradeGroupHeader
                    tone="same_socket"
                    tag={VI_MESSAGES.tools.upgrade.sameSocketSectionTag}
                    statusLabel={VI_MESSAGES.tools.upgrade.sameSocketStatusBadge}
                    count={state.data.sameSocketCpus.length}
                    title={VI_MESSAGES.tools.upgrade.sameSocketGroupTitle}
                    description={VI_MESSAGES.tools.upgrade.sameSocketGroupDesc}
                    notice={VI_MESSAGES.tools.upgrade.biosUpdateHint}
                  />
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    {state.data.sameSocketCpus.map((item) => (
                      <CpuUpgradeCard
                        key={item.id}
                        item={item}
                        onAddToCart={actions.onAddToCart}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {state.data.platformSwapCpus.length > 0 ? (
                <section
                  data-testid={TEST_IDS.upgrade.groupPlatformSwap}
                  className="flex flex-col gap-4"
                >
                  <UpgradeGroupHeader
                    tone="platform_swap"
                    tag={VI_MESSAGES.tools.upgrade.platformSwapSectionTag}
                    statusLabel={VI_MESSAGES.tools.upgrade.platformSwapStatusBadge}
                    count={state.data.platformSwapCpus.length}
                    title={VI_MESSAGES.tools.upgrade.platformSwapGroupTitle}
                    description={VI_MESSAGES.tools.upgrade.platformSwapGroupDesc}
                  />
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                    {state.data.platformSwapCpus.map((item) => (
                      <CpuUpgradeCard
                        key={item.id}
                        item={item}
                        onAddToCart={actions.onAddToCart}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <section className="flex flex-col gap-4">
              <UpgradeGroupHeader
                tone="gpu"
                tag={VI_MESSAGES.tools.upgrade.gpuSectionTag}
                statusLabel={VI_MESSAGES.tools.upgrade.gpuStatusBadge}
                count={state.data.gpus.length}
                title={VI_MESSAGES.tools.upgrade.gpuGroupTitle}
                description={VI_MESSAGES.tools.upgrade.gpuGroupDesc}
              />
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                {state.data.gpus.map((item) => (
                  <GpuUpgradeCard
                    key={item.seriesId}
                    item={item}
                    onAddToCart={actions.onAddToCart}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}

      <Card className="flex flex-col gap-2 bg-surface-subtle text-xs text-ink-muted">
        {activeNotes.map((note, idx) => (
          <p key={idx}>{note}</p>
        ))}
      </Card>
    </div>
  );
}
