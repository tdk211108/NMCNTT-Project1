import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge } from '@/components/ui/Icons';
import { SearchableSelect, type SearchableSelectGroup } from '@/components/ui/SearchableSelect';
import { formatExactWatts } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { PsuOption } from '@/shared/types';
import type { usePsuController } from '../usePsuController';

function buildPsuGroups(
  retail: readonly PsuOption[],
  legacy: readonly PsuOption[],
): SearchableSelectGroup[] {
  return [
    ...(retail.length > 0
      ? [
          {
            id: 'retail',
            label: VI_MESSAGES.tools.psu.groupRetail,
            options: retail.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.vendor.toUpperCase(),
              keywords: item.vendor,
            })),
          },
        ]
      : []),
    ...(legacy.length > 0
      ? [
          {
            id: 'legacy',
            label: VI_MESSAGES.tools.psu.groupLegacy,
            options: legacy.map((item) => ({
              value: item.id,
              label: item.name,
              meta: item.vendor.toUpperCase(),
              keywords: item.vendor,
            })),
          },
        ]
      : []),
  ];
}

export type PsuEstimatorViewProps = ReturnType<typeof usePsuController>;

export function PsuEstimatorView({ state, actions }: PsuEstimatorViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="bolt-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.tools.psu.title}</h1>
      </div>

      {state.prefillMissing ? (
        <Card
          data-testid={TEST_IDS.psu.prefillNotice}
          className="border-warning/60 bg-surface-subtle text-sm font-medium text-warning"
        >
          {VI_MESSAGES.tools.psu.prefillMissingNotice}
        </Card>
      ) : null}

      {state.isLoadingOptions ? (
        <Spinner />
      ) : state.errorMessage && !state.retailCpus.length && !state.retailGpus.length ? (
        <EmptyState
          title={state.errorMessage}
          action={
            <Button variant="primary" onClick={actions.onRetryOptions}>
              {VI_MESSAGES.common.retry}
            </Button>
          }
        />
      ) : (
        <Card className="relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              actions.onCalculate();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SearchableSelect
                label={VI_MESSAGES.tools.psu.cpuLabel}
                value={state.selectedCpu}
                groups={buildPsuGroups(state.retailCpus, state.legacyCpus)}
                placeholder={VI_MESSAGES.tools.psu.selectCpuPlaceholder}
                triggerTestId={TEST_IDS.psu.cpuSelect}
                searchTestId={TEST_IDS.psu.cpuSearch}
                optionTestId={TEST_IDS.psu.cpuOption}
                onChange={actions.onSelectCpu}
              />

              <SearchableSelect
                label={VI_MESSAGES.tools.psu.gpuLabel}
                value={state.selectedGpu}
                groups={buildPsuGroups(state.retailGpus, state.legacyGpus)}
                placeholder={VI_MESSAGES.tools.psu.selectGpuPlaceholder}
                triggerTestId={TEST_IDS.psu.gpuSelect}
                searchTestId={TEST_IDS.psu.gpuSearch}
                optionTestId={TEST_IDS.psu.gpuOption}
                onChange={actions.onSelectGpu}
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={!state.canCalculate}
                isLoading={state.isCalculating}
                data-testid={TEST_IDS.psu.calculate}
              >
                {VI_MESSAGES.tools.psu.calculateButton}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {state.errorMessage && (state.retailCpus.length > 0 || state.retailGpus.length > 0) ? (
        <EmptyState title={state.errorMessage} />
      ) : null}

      {state.estimate ? (
        <Card className="aero-glass-elevated flex flex-col gap-4 border-border-strong">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-[16px] border border-border bg-surface-subtle/80 p-4 shadow-[inset_0_1px_0_var(--aero-specular)]">
              <p className="text-sm font-medium text-ink-muted">{VI_MESSAGES.tools.psu.exactResultLabel}</p>
              <p
                data-testid={TEST_IDS.psu.resultExact}
                className="mt-1 font-mono text-3xl font-bold tabular-nums text-ink"
              >
                {formatExactWatts(state.estimate.exactW)}
              </p>
            </div>

            <div className="rounded-[16px] border border-border-strong bg-accent/12 p-4 shadow-[inset_0_1px_0_var(--aero-specular)]">
              <p className="text-sm font-medium text-ink-muted">{VI_MESSAGES.tools.psu.recommendedTierLabel}</p>
              <p
                data-testid={TEST_IDS.psu.resultTier}
                className="mt-1 font-mono text-3xl font-bold tabular-nums text-primary"
              >
                {state.estimate.exceedsMaxTier || state.estimate.recommendedTierW === null
                  ? VI_MESSAGES.tools.psu.aboveMaxTierLabel
                  : `${state.estimate.recommendedTierW} W`}
              </p>
            </div>
          </div>

          <p className="font-mono text-sm text-ink-muted">
            {VI_MESSAGES.tools.psu.formulaSummary(
              state.estimate.cpu.psuPowerW,
              state.estimate.gpu.tbpW,
              state.estimate.baseSystemW,
              state.estimate.headroomFactor,
            )}
          </p>

          <div className="flex flex-col gap-1 border-t border-border/70 pt-3 text-xs leading-relaxed text-ink-muted">
            {state.estimate.notes.map((note, idx) => (
              <p key={idx}>{note}</p>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
