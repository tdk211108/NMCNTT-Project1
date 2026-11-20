import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge, SolarIcon } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { CpuVendor } from '@/shared/types';
import type { useAdminLegacyCpusController } from '../useAdminLegacyCpusController';

export type AdminLegacyCpusViewProps = ReturnType<typeof useAdminLegacyCpusController>;

export function AdminLegacyCpusView({ state, actions }: AdminLegacyCpusViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AeroIconBadge name="tuning-2-bold-duotone" size="lg" />
          <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.admin.navLegacyCpus}</h1>
        </div>
        <Button
          size="sm"
          variant="secondary"
          data-testid={TEST_IDS.admin.legacyCpuAdd}
          onClick={actions.onStartCreate}
        >
          {VI_MESSAGES.admin.addNewButton}
        </Button>
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
                label="Tên CPU tham khảo"
                required
                value={state.form.name}
                onChange={(e) => actions.onUpdateField('name', e.target.value)}
              />
              <Select
                label="Hãng chip"
                value={state.form.vendor}
                onChange={(e) => actions.onUpdateField('vendor', e.target.value as CpuVendor)}
              >
                <option value="intel">Intel</option>
                <option value="amd">AMD</option>
              </Select>
              <Input
                type="number"
                label="PSU Power (W)"
                required
                value={state.form.psuPowerW}
                onChange={(e) => actions.onUpdateField('psuPowerW', e.target.value)}
              />
              <Input
                label="Socket (tùy chọn)"
                value={state.form.socket}
                onChange={(e) => actions.onUpdateField('socket', e.target.value)}
              />
              <Input
                type="number"
                label="Số nhân (tùy chọn)"
                value={state.form.coresTotal}
                onChange={(e) => actions.onUpdateField('coresTotal', e.target.value)}
              />
              <Input
                type="number"
                label="Số luồng (tùy chọn)"
                value={state.form.threadsTotal}
                onChange={(e) => actions.onUpdateField('threadsTotal', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={actions.onCancelForm}>
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={state.isSaving}
                data-testid={TEST_IDS.admin.legacyCpuSave}
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
        <ResponsiveTableWrapper label={VI_MESSAGES.admin.navLegacyCpus}>
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-surface-subtle/85">
                <th className="px-4 py-3 font-semibold text-ink-muted">ID</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Tên CPU</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Socket / Nhân / Luồng</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">PSU Power</th>
                <th className="px-4 py-3 font-semibold text-ink-muted">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr
                  key={item.id}
                  data-testid={TEST_IDS.admin.legacyCpuRow(item.id)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-subtle/60"
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">{item.id}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink-muted">
                    {item.socket ?? ''} | {item.coresTotal ?? '-'}/{item.threadsTotal ?? '-'}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">{item.psuPowerW} W</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={TEST_IDS.admin.legacyCpuEdit(item.id)}
                        onClick={() => actions.onStartEdit(item)}
                      >
                        <SolarIcon name="pen-bold-duotone" className="h-3.5 w-3.5" withShadow={false} />
                        <span>{VI_MESSAGES.common.edit}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={state.isDeleting}
                        data-testid={TEST_IDS.admin.legacyCpuDelete(item.id)}
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
