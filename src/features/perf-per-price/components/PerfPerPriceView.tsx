import Link from 'next/link';
import { Badge, Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { AeroIconBadge } from '@/components/ui/Icons';
import { Input } from '@/components/ui/Input';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatNumberVi, formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { usePerfPerPriceController } from '../usePerfPerPriceController';

export type PerfPerPriceViewProps = ReturnType<typeof usePerfPerPriceController>;

export function PerfPerPriceView({ state, actions }: PerfPerPriceViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <AeroIconBadge name="graph-up-bold-duotone" size="lg" />
        <h1 className="text-2xl font-bold text-ink">{VI_MESSAGES.tools.perfPerPrice.title}</h1>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            actions.onSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-sm font-semibold text-ink">
              {VI_MESSAGES.tools.perfPerPrice.categoryLabel}:
            </span>
            <Button
              size="sm"
              variant={state.category === 'cpu' ? 'primary' : 'outline'}
              data-testid={TEST_IDS.ppp.category('cpu')}
              onClick={() => actions.onChangeCategory('cpu')}
            >
              {VI_MESSAGES.nav.cpu}
            </Button>
            <Button
              size="sm"
              variant={state.category === 'gpu' ? 'primary' : 'outline'}
              data-testid={TEST_IDS.ppp.category('gpu')}
              onClick={() => actions.onChangeCategory('gpu')}
            >
              {VI_MESSAGES.nav.gpu}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {VI_MESSAGES.catalog.filterVendorLabel}:
            </span>
            {state.availableVendors.map((vendor) => {
              const active = state.selectedVendors.includes(vendor);
              return (
                <Button
                  key={vendor}
                  size="sm"
                  variant={active ? 'primary' : 'outline'}
                  data-testid={TEST_IDS.ppp.vendor(vendor)}
                  onClick={() => actions.onToggleVendor(vendor)}
                >
                  {vendor.toUpperCase()}
                </Button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <Input
                type="text"
                inputMode="numeric"
                label={VI_MESSAGES.tools.perfPerPrice.maxBudgetLabel}
                value={state.maxPriceInput}
                error={state.budgetInputError ?? undefined}
                data-testid={TEST_IDS.ppp.maxPrice}
                onChange={(e) => actions.onChangeMaxPrice(e.target.value)}
                className="font-mono tabular-nums"
              />
            </div>
            <Button type="submit" variant="primary" data-testid={TEST_IDS.ppp.submit}>
              {VI_MESSAGES.tools.perfPerPrice.submitLabel}
            </Button>
          </div>
        </form>
      </Card>

      {state.isLoading ? (
        <Spinner />
      ) : state.errorMessage ? (
        <EmptyState title={state.errorMessage} />
      ) : !state.data || state.data.items.length === 0 ? (
        <EmptyState
          testId={TEST_IDS.ppp.empty}
          title={VI_MESSAGES.tools.perfPerPrice.emptyBudget}
        />
      ) : (
        <ResponsiveTableWrapper label={VI_MESSAGES.tools.perfPerPrice.title}>
          <table
            data-testid={TEST_IDS.ppp.table}
            className="w-full min-w-[620px] border-collapse text-left text-sm"
          >
            <thead>
              <tr className="border-b border-border/70 bg-surface-subtle/85">
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.rank}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.product}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.vendor}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.price}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.score}
                </th>
                <th className="px-4 py-3 font-semibold text-ink-muted">
                  {VI_MESSAGES.tools.perfPerPrice.columns.perfPerPrice}
                </th>
              </tr>
            </thead>
            <tbody>
              {state.data.items.map((item) => (
                <tr
                  key={item.id}
                  data-testid={TEST_IDS.ppp.row(item.id)}
                  className="border-b border-border/60 transition-colors last:border-b-0 hover:bg-surface-subtle/60"
                >
                  <td className="px-4 py-3 font-mono font-bold tabular-nums text-ink">
                    #{item.rank}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/products/${item.id}`} className="font-semibold text-ink hover:text-primary">
                        {item.name}
                      </Link>
                      {item.bestValue ? (
                        <Badge
                          variant="success"
                          data-testid={TEST_IDS.ppp.bestValue(item.id)}
                        >
                          {VI_MESSAGES.tools.perfPerPrice.bestValueBadge}
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{item.vendor.toUpperCase()}</td>
                  <td className="px-4 py-3 font-mono font-semibold tabular-nums text-ink">
                    {formatVnd(item.priceVnd)}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums text-ink">
                    {item.score.normalized !== null
                      ? `${formatNumberVi(item.score.normalized, 1)} (${formatNumberVi(item.score.raw)})`
                      : VI_MESSAGES.common.noData}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold tabular-nums text-primary">
                    {formatNumberVi(item.perfPerPrice, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrapper>
      )}

      {state.data?.notes.length ? (
        <Card className="flex flex-col gap-2 bg-surface-subtle/85 text-xs leading-relaxed text-ink-muted">
          {state.data.notes.map((note, idx) => (
            <p key={idx}>{note}</p>
          ))}
        </Card>
      ) : null}
    </div>
  );
}
