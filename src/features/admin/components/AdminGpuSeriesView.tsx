import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { GpuVendor } from '@/shared/types';
import type { useAdminGpuSeriesController } from '../useAdminGpuSeriesController';

export type AdminGpuSeriesViewProps = ReturnType<typeof useAdminGpuSeriesController>;

export function AdminGpuSeriesView({ state, actions }: AdminGpuSeriesViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AeroIconBadge name="monitor-bold-duotone" size="lg" />
          <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.navGpuSeries}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={state.kind === 'retail' ? 'primary' : 'outline'}
            data-testid={TEST_IDS.admin.seriesKindTab('retail')}
            onClick={() => actions.onChangeKind('retail')}
          >
            {VI_MESSAGES.tools.psu.groupRetail}
          </Button>
          <Button
            size="sm"
            variant={state.kind === 'legacy' ? 'primary' : 'outline'}
            data-testid={TEST_IDS.admin.seriesKindTab('legacy')}
            onClick={() => actions.onChangeKind('legacy')}
          >
            {VI_MESSAGES.tools.psu.groupLegacy}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            data-testid={TEST_IDS.admin.seriesAdd}
            onClick={actions.onStartCreate}
          >
            {VI_MESSAGES.admin.addNewButton}
          </Button>
        </div>
      </div>

      {state.form ? (
        <Card className="aero-glass-elevated">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              actions.onSave();
            }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                label="Tên dòng GPU"
                required
                value={state.form.name}
                onChange={(e) => actions.onUpdateField('name', e.target.value)}
              />
              <Select
                label="Hãng chip"
                value={state.form.vendor}
                onChange={(e) => actions.onUpdateField('vendor', e.target.value as GpuVendor)}
              >
                <option value="nvidia">NVIDIA</option>
                <option value="amd">AMD</option>
              </Select>
              <Input
                type="number"
                label="VRAM (GB)"
                required
                value={state.form.vramGb}
                onChange={(e) => actions.onUpdateField('vramGb', e.target.value)}
              />
              <Input
                type="number"
                label="TBP (W)"
                required
                value={state.form.tbpW}
                onChange={(e) => actions.onUpdateField('tbpW', e.target.value)}
              />

              {state.form.kind === 'retail' ? (
                <>
                  <Input
                    type="number"
                    label="Cores"
                    required
                    value={state.form.cores}
                    onChange={(e) => actions.onUpdateField('cores', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Base Clock (MHz)"
                    required
                    value={state.form.baseClockMhz}
                    onChange={(e) => actions.onUpdateField('baseClockMhz', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Boost Clock (MHz)"
                    required
                    value={state.form.boostClockMhz}
                    onChange={(e) => actions.onUpdateField('boostClockMhz', e.target.value)}
                  />
                  <Input
                    label="Memory Type"
                    required
                    value={state.form.memoryType}
                    onChange={(e) => actions.onUpdateField('memoryType', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Bus Width (bit)"
                    required
                    value={state.form.busWidthBit}
                    onChange={(e) => actions.onUpdateField('busWidthBit', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="PassMark Raw"
                    required
                    value={state.form.passmarkRaw}
                    onChange={(e) => actions.onUpdateField('passmarkRaw', e.target.value)}
                  />
                  <Input
                    label="PassMark Source"
                    required
                    value={state.form.passmarkSource}
                    onChange={(e) => actions.onUpdateField('passmarkSource', e.target.value)}
                  />
                </>
              ) : null}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={actions.onCancelForm}>
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={state.isSaving}
                data-testid={TEST_IDS.admin.seriesSave}
              >
                {VI_MESSAGES.common.save}
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {state.isLoading ? (
        <Spinner />
      ) : state.items.length === 0 ? (
        <EmptyState title={VI_MESSAGES.common.noData} />
      ) : (
        <ResponsiveTableWrapper label={VI_MESSAGES.admin.navGpuSeries}>
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-surface-subtle/85">
                <th className="px-4 py-3 font-semibold text-ink-muted">ID</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Tên dòng GPU</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">VRAM / TBP</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Biến thể active</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr
                  key={item.id}
                  data-testid={TEST_IDS.admin.seriesRow(item.id)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-subtle/60"
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{item.id}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink-muted">
                    {item.vramGb} GB | {item.tbpW} W
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{item.activeVariantCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={TEST_IDS.admin.seriesEdit(item.id)}
                        onClick={() => actions.onStartEdit(item)}
                      >
                        <SolarIcon name="pen-bold-duotone" className="h-3.5 w-3.5" withShadow={false} />
                        <span>{VI_MESSAGES.common.edit}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={state.isDeleting}
                        data-testid={TEST_IDS.admin.seriesDelete(item.id)}
                        onClick={() => actions.onDelete(item.id)}
                      >
                        <SolarIcon name="trash-bin-trash-bold-duotone" className="h-3.5 w-3.5" withShadow={false} />
                        <span>{VI_MESSAGES.common.delete}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrapper>
      )}
    </div>
  );
}
