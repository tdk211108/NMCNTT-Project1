import { AlertTriangle, Gauge, Layers, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { CpuIcon, GpuCardIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { COMBO_BUDGET_PRESETS_VND } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { ComboPurpose, ComboRecommendation, CpuVendor, GpuVendor } from '@/shared/types';
import type { useComboAdvisorController } from '../useComboAdvisorController';

export type ComboAdvisorViewProps = ReturnType<typeof useComboAdvisorController>;

const PURPOSES: readonly ComboPurpose[] = ['gaming_aaa', 'esport', 'work_ai'];

function formatPresetChipLabel(amountVnd: number): string {
  return `${Math.round(amountVnd / 1_000_000)} triệu`;
}

function ComboCard({
  combo,
  onAddBoth,
}: {
  combo: ComboRecommendation;
  onAddBoth: (combo: ComboRecommendation) => void;
}) {
  const roleLabel = VI_MESSAGES.tools.combo.optionLabel(
    combo.rank,
    VI_MESSAGES.tools.combo.roleTitle[combo.role],
  );
  const deltaFormatted = formatVnd(Math.abs(combo.budgetDeltaVnd));

  return (
    <Card
      data-testid={TEST_IDS.combo.card(combo.rank)}
      className="flex flex-col justify-between gap-4 border-border-strong bg-surface"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <Badge variant={combo.rank === 1 ? 'accent' : 'default'}>{roleLabel}</Badge>
          {combo.isOverBudget && combo.overBudgetPct !== null ? (
            <Badge
              variant="warning"
              data-testid={TEST_IDS.combo.stretchBadge(combo.rank)}
            >
              {VI_MESSAGES.tools.combo.stretchBadge(combo.overBudgetPct)}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-ink-muted">{VI_MESSAGES.tools.combo.totalPriceLabel}</p>
          <p className="font-mono text-2xl font-bold tabular-nums text-accent-ink">
            {formatVnd(combo.totalPriceVnd)}
          </p>
          <p
            className={`font-mono text-xs font-semibold tabular-nums ${
              combo.isOverBudget ? 'text-warning' : 'text-success'
            }`}
          >
            {combo.isOverBudget
              ? VI_MESSAGES.tools.combo.overBudgetDelta(deltaFormatted)
              : VI_MESSAGES.tools.combo.withinBudgetDelta(deltaFormatted)}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            aria-hidden="true"
            className="flex h-2.5 w-full overflow-hidden border border-border-strong bg-surface-subtle"
          >
            <div
              style={{ width: `${combo.actualGpuSharePct}%` }}
              className="h-full bg-primary"
            />
            <div
              style={{ width: `${combo.actualCpuSharePct}%` }}
              className="h-full bg-ink-muted/45"
            />
          </div>
          <p className="font-mono text-xs tabular-nums text-ink-muted">
            {VI_MESSAGES.tools.combo.allocationLabel(
              combo.actualGpuSharePct,
              combo.actualCpuSharePct,
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 border-2 border-border bg-surface-subtle p-3">
            <ProductImage
              src={combo.cpu.imageUrl}
              alt={combo.cpu.name}
              className="h-16 w-16 shrink-0 border border-border-strong bg-white object-contain p-1"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ink-muted uppercase">
                  <CpuIcon className="h-3.5 w-3.5" />
                  <span>CPU</span>
                </span>
                <Badge variant={vendorBadgeVariant(combo.cpu.vendor)}>
                  {combo.cpu.vendor.toUpperCase()}
                </Badge>
              </div>
              <Link
                href={`/products/${combo.cpu.id}`}
                className="font-display text-sm font-bold text-ink hover:text-accent-ink hover:underline"
              >
                {combo.cpu.name}
              </Link>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatVnd(combo.cpu.priceVnd)}
                </span>
                <span className="font-mono text-ink-muted tabular-nums">
                  {combo.cpu.score.normalized !== null
                    ? `${formatNumberVi(combo.cpu.score.normalized, 1)} điểm`
                    : formatNumberVi(combo.cpu.score.raw)}
                </span>
              </div>
              <p className="font-mono text-xs text-ink-muted">
                {combo.cpu.socket} · {combo.cpu.coresTotal}/{combo.cpu.threadsTotal} luồng
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-2 border-border bg-surface-subtle p-3">
            <ProductImage
              src={combo.gpu.imageUrl}
              alt={combo.gpu.name}
              className="h-16 w-16 shrink-0 border border-border-strong bg-white object-contain p-1"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-ink-muted uppercase">
                  <GpuCardIcon className="h-3.5 w-3.5" />
                  <span>GPU</span>
                </span>
                <Badge variant={vendorBadgeVariant(combo.gpu.vendor)}>
                  {combo.gpu.vendor.toUpperCase()}
                </Badge>
                <Badge variant="aib">{combo.gpu.aibBrand}</Badge>
              </div>
              <Link
                href={`/products/${combo.gpu.id}`}
                className="font-display text-sm font-bold text-ink hover:text-accent-ink hover:underline"
              >
                {combo.gpu.name}
              </Link>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold tabular-nums text-ink">
                  {formatVnd(combo.gpu.priceVnd)}
                </span>
                <span className="font-mono text-ink-muted tabular-nums">
                  {combo.gpu.score.normalized !== null
                    ? `${formatNumberVi(combo.gpu.score.normalized, 1)} điểm`
                    : formatNumberVi(combo.gpu.score.raw)}
                </span>
              </div>
              <p className="font-mono text-xs text-ink-muted">
                {combo.gpu.vramGb} GB VRAM · {combo.gpu.tbpW} W TBP
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <Button
          variant="primary"
          size="sm"
          sfx="success"
          className="w-full"
          data-testid={TEST_IDS.combo.addBoth(combo.rank)}
          onClick={() => onAddBoth(combo)}
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{VI_MESSAGES.tools.combo.addBothToCart}</span>
        </Button>

        <Link
          href={combo.psu.psuHref}
          className="w-full"
          data-testid={TEST_IDS.combo.psuLink(combo.rank)}
        >
          <Button variant="outline" size="sm" cyber={false} className="w-full">
            <Gauge className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{VI_MESSAGES.tools.combo.calculatePsuAction}</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export function ComboAdvisorView({ state, actions }: ComboAdvisorViewProps) {
  const activeNotes = state.data?.notes ?? [
    VI_MESSAGES.tools.disclaimers.passmark,
    VI_MESSAGES.tools.disclaimers.estimation,
    VI_MESSAGES.tools.combo.budgetScopeNote,
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb
        items={[
          { label: VI_MESSAGES.nav.home, href: '/' },
          { label: VI_MESSAGES.tools.combo.title, href: '/tools/combo' },
        ]}
      />

      <div className="flex flex-col gap-1.5">
        <div className="inline-flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-accent-ink uppercase">
          <Layers className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>ADVISOR // SMART COMBO</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.tools.combo.title}</h1>
        <p className="text-sm text-ink-muted">{VI_MESSAGES.tools.combo.subtitle}</p>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            actions.onSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <Input
                type="text"
                inputMode="numeric"
                label={VI_MESSAGES.tools.combo.budgetLabel}
                value={state.budgetInput}
                error={state.budgetError ?? undefined}
                data-testid={TEST_IDS.combo.budgetInput}
                onChange={(e) => actions.onChangeBudgetInput(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-ink-muted">
                  {VI_MESSAGES.tools.combo.budgetPresetsLabel}:
                </span>
                {COMBO_BUDGET_PRESETS_VND.map((amount) => {
                  const active = state.appliedBudgetVnd === amount;
                  return (
                    <Button
                      key={amount}
                      size="sm"
                      cyber={false}
                      sfx="toggle"
                      variant={active ? 'primary' : 'outline'}
                      data-testid={TEST_IDS.combo.budgetPreset(amount)}
                      onClick={() => actions.onSelectBudgetPreset(amount)}
                    >
                      {formatPresetChipLabel(amount)}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-ink">
                {VI_MESSAGES.tools.combo.purposeLabel}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {PURPOSES.map((key) => {
                  const active = state.purpose === key;
                  return (
                    <Button
                      key={key}
                      size="sm"
                      cyber={false}
                      sfx="toggle"
                      variant={active ? 'primary' : 'outline'}
                      data-testid={TEST_IDS.combo.purpose(key)}
                      onClick={() => actions.onSelectPurpose(key)}
                    >
                      {VI_MESSAGES.tools.combo.purposes[key].label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-muted">
                {VI_MESSAGES.tools.combo.purposes[state.purpose].splitHint}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink">
                {VI_MESSAGES.tools.combo.cpuVendorLabel}:
              </span>
              {(
                [
                  { value: null, label: VI_MESSAGES.tools.combo.allVendorsOption, key: 'all' },
                  { value: 'intel' as CpuVendor, label: 'Intel', key: 'intel' },
                  { value: 'amd' as CpuVendor, label: 'AMD', key: 'amd' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
                  variant={state.cpuVendor === opt.value ? 'primary' : 'outline'}
                  data-testid={TEST_IDS.combo.cpuVendor(opt.key)}
                  onClick={() => actions.onSelectCpuVendor(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-ink">
                {VI_MESSAGES.tools.combo.gpuVendorLabel}:
              </span>
              {(
                [
                  { value: null, label: VI_MESSAGES.tools.combo.allVendorsOption, key: 'all' },
                  { value: 'nvidia' as GpuVendor, label: 'NVIDIA', key: 'nvidia' },
                  { value: 'amd' as GpuVendor, label: 'AMD', key: 'amd' },
                  { value: 'intel' as GpuVendor, label: 'Intel', key: 'intel' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.key}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
                  variant={state.gpuVendor === opt.value ? 'primary' : 'outline'}
                  data-testid={TEST_IDS.combo.gpuVendor(opt.key)}
                  onClick={() => actions.onSelectGpuVendor(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" data-testid={TEST_IDS.combo.submit}>
              {VI_MESSAGES.tools.combo.submitLabel}
            </Button>
          </div>
        </form>
      </Card>

      {state.isLoading ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : state.data && state.data.combos.length === 0 ? (
        <Card
          data-testid={TEST_IDS.combo.minBudgetNotice}
          className="flex flex-col gap-3 border-warning/70 bg-surface-subtle"
        >
          <div className="flex items-start gap-2.5 text-ink">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="font-display text-base font-bold text-ink">
                {VI_MESSAGES.tools.combo.minBudgetTitle}
              </p>
              {state.data.cheapestReferenceCombo ? (
                <p className="text-sm text-ink-muted">
                  {VI_MESSAGES.tools.combo.minBudgetDesc(
                    formatVnd(state.data.cheapestReferenceCombo.totalPriceVnd),
                    state.data.cheapestReferenceCombo.cpuName,
                    state.data.cheapestReferenceCombo.gpuName,
                  )}
                </p>
              ) : (
                <p className="text-sm text-ink-muted">{VI_MESSAGES.common.noData}</p>
              )}
            </div>
          </div>

          {state.data.minAvailableComboPriceVnd !== null ? (
            <div>
              <Button
                variant="outline"
                size="sm"
                cyber={false}
                onClick={() =>
                  actions.onApplyMinBudget(state.data!.minAvailableComboPriceVnd!)
                }
              >
                {VI_MESSAGES.tools.combo.applyMinBudgetButton}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : state.data ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {state.data.combos.map((combo) => (
            <ComboCard key={`${combo.rank}-${combo.gpu.seriesId}`} combo={combo} onAddBoth={actions.onAddBothToCart} />
          ))}
        </div>
      ) : null}

      <Card className="flex flex-col gap-2 bg-surface-subtle text-xs text-ink-muted">
        {activeNotes.map((note, idx) => (
          <p key={idx}>{note}</p>
        ))}
      </Card>
    </div>
  );
}
