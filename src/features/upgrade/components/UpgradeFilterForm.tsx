import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ComboboxSelect, type ComboboxSelectOption } from '@/components/ui/ComboboxSelect';
import { CpuIcon, GpuCardIcon } from '@/components/ui/Icons';
import { PriceInput } from '@/components/ui/PriceInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { buildRetailLegacyGroups } from '@/features/tools/hardware-select-groups';
import { parsePriceInputDigits } from '@/lib/format';
import {
  UPGRADE_CPU_BUDGET_PRESETS_VND,
  UPGRADE_GPU_BUDGET_PRESETS_VND,
} from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { UpgradeCpuOption, UpgradeGpuOption, UpgradeSort } from '@/shared/types';
import type { useUpgradeAdvisorController } from '../useUpgradeAdvisorController';

type Controller = ReturnType<typeof useUpgradeAdvisorController>;

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
) {
  return buildRetailLegacyGroups(retail, legacy, {
    retailId: 'retail-cpu',
    legacyId: 'legacy-cpu',
    getMeta: (item, isLegacy) =>
      isLegacy
        ? item.hasPassmark
          ? (item.socket ?? item.vendor.toUpperCase())
          : VI_MESSAGES.tools.upgrade.cpuLegacyMissingScoreMeta(item.socket)
        : (item.socket ?? item.vendor.toUpperCase()),
    getKeywords: (item) => `${item.vendor} ${item.socket ?? ''}`,
  });
}

function buildGpuSelectGroups(
  retail: readonly UpgradeGpuOption[],
  legacy: readonly UpgradeGpuOption[],
) {
  return buildRetailLegacyGroups(retail, legacy, {
    retailId: 'retail-gpu',
    legacyId: 'legacy-gpu',
    getMeta: (item, isLegacy) =>
      isLegacy && !item.hasPassmark
        ? VI_MESSAGES.tools.upgrade.gpuLegacyMissingScoreMeta(item.vramGb)
        : VI_MESSAGES.tools.upgrade.vramMeta(item.vramGb),
    getKeywords: (item) => `${item.vendor} ${item.vramGb}GB`,
  });
}

export function UpgradeFilterForm({
  state,
  actions,
}: {
  state: Controller['state'];
  actions: Controller['actions'];
}) {
  const presets =
    state.category === 'cpu' ? UPGRADE_CPU_BUDGET_PRESETS_VND : UPGRADE_GPU_BUDGET_PRESETS_VND;
  const selectGroups =
    state.category === 'cpu'
      ? buildCpuSelectGroups(state.retailCpuOptions, state.legacyCpuOptions)
      : buildGpuSelectGroups(state.retailGpuOptions, state.legacyGpuOptions);

  return (
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
            <PriceInput
              label={VI_MESSAGES.tools.upgrade.budgetLabel}
              value={state.budgetInput}
              error={state.budgetError ?? undefined}
              data-testid={TEST_IDS.upgrade.budgetInput}
              onValueChange={actions.onChangeBudgetInput}
            />
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <span className="col-span-2 text-xs font-medium text-ink-muted sm:col-span-1">
                {VI_MESSAGES.tools.upgrade.budgetPresetsLabel}:
              </span>
              {presets.map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  cyber={false}
                  sfx="toggle"
                  className="w-full sm:w-auto"
                  variant={
                    parsePriceInputDigits(state.budgetInput) === amount ? 'primary' : 'outline'
                  }
                  onClick={() => actions.onSelectBudgetPreset(amount)}
                >
                  {VI_MESSAGES.tools.combo.presetChipLabel(Math.round(amount / 1_000_000))}
                </Button>
              ))}
              {state.budgetInput ? (
                <Button
                  size="sm"
                  cyber={false}
                  variant="ghost"
                  className="col-span-2 w-full sm:col-span-1 sm:w-auto"
                  onClick={actions.onClearBudget}
                >
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
            className="w-full sm:w-auto"
            data-testid={TEST_IDS.upgrade.submit}
          >
            {VI_MESSAGES.tools.upgrade.submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
