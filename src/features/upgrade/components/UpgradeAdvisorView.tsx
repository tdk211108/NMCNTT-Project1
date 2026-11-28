import { AlertCircle, TrendingUp } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useUpgradeAdvisorController } from '../useUpgradeAdvisorController';
import { CpuUpgradeCard, GpuUpgradeCard, UpgradeGroupHeader } from './UpgradeCards';
import { UpgradeFilterForm } from './UpgradeFilterForm';

export type UpgradeAdvisorViewProps = ReturnType<typeof useUpgradeAdvisorController>;

export function UpgradeAdvisorView({ state, actions }: UpgradeAdvisorViewProps) {
  const hasAnyResults = state.data
    ? state.data.sameSocketCpus.length > 0 ||
      state.data.platformSwapCpus.length > 0 ||
      state.data.gpus.length > 0
    : false;

  const activeNotes = state.data?.notes ?? [
    VI_MESSAGES.tools.disclaimers.passmark,
    VI_MESSAGES.tools.disclaimers.upgrade,
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
        <UpgradeFilterForm state={state} actions={actions} />
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
                  ? `${VI_MESSAGES.tools.specs.passmarkPrefix}: ${formatNumberVi(state.data.current.passmarkRaw)}`
                  : VI_MESSAGES.tools.upgrade.missingPassmarkBadge}
              </p>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-ink-muted">
              {state.data.category === 'cpu' ? (
                <>
                  <span>
                    {VI_MESSAGES.tools.specs.socket}:{' '}
                    {state.data.current.socket ?? VI_MESSAGES.common.noData}
                  </span>
                  <span>
                    {VI_MESSAGES.tools.specs.coresThreads}:{' '}
                    {state.data.current.coresTotal && state.data.current.threadsTotal
                      ? `${state.data.current.coresTotal}/${state.data.current.threadsTotal}`
                      : VI_MESSAGES.common.noData}
                  </span>
                  <span>
                    {VI_MESSAGES.tools.specs.psuMax}:{' '}
                    {state.data.current.psuPowerW !== null
                      ? `${state.data.current.psuPowerW} W`
                      : VI_MESSAGES.common.noData}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {VI_MESSAGES.tools.specs.vram}: {state.data.current.vramGb ?? 0} GB
                  </span>
                  <span>
                    {VI_MESSAGES.tools.specs.tbp}: {state.data.current.tbpW ?? 0} W
                  </span>
                </>
              )}
            </div>
          </Card>

          {!state.data.current.hasPassmark ? (
            <Card
              data-no-grid-cascade=""
              className="border-warning/70 bg-surface p-3 text-sm text-ink"
            >
              <div className="flex items-start gap-2 rounded-control border border-warning/60 bg-warning/15 px-3 py-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                <span className="min-w-0 wrap-anywhere">
                  {VI_MESSAGES.tools.upgrade.missingPassmarkNote}
                </span>
              </div>
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
