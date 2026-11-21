import { Plus, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Badge, Card, vendorBadgeVariant } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { ProductImage, ZoomableImageFrame } from '@/components/ui/ProductImage';
import { SearchableSelect, type SearchableSelectGroup } from '@/components/ui/SearchableSelect';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { useComparePageController } from '../useComparePageController';

export type CompareTableViewProps = ReturnType<typeof useComparePageController>;

export function CompareTableView({ state, actions }: CompareTableViewProps) {
  const visibleIndexes: Array<0 | 1 | 2> = state.showThirdColumn ? [0, 1, 2] : [0, 1];
  const anySelected = state.slots.some(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.tools.compare.title}</h1>
          {state.lockedCategory ? (
            <Badge variant="accent">{state.lockedCategory.toUpperCase()}</Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!state.showThirdColumn ? (
            <Button
              variant="outline"
              size="sm"
              data-testid={TEST_IDS.compare.addColumn}
              onClick={actions.onAddColumn}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.tools.compare.addThirdColumn}</span>
            </Button>
          ) : null}
          {anySelected || state.showThirdColumn ? (
            <Button
              variant="ghost"
              size="sm"
              data-testid={TEST_IDS.compare.clearAll}
              onClick={actions.onClearAll}
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{VI_MESSAGES.tools.compare.clearAll}</span>
            </Button>
          ) : null}
        </div>
      </div>

      {state.isLoadingCatalog ? (
        <Spinner />
      ) : state.catalogErrorMessage ? (
        <EmptyState
          title={state.catalogErrorMessage}
          action={
            <Button variant="primary" onClick={actions.onRetryCatalog}>
              {VI_MESSAGES.common.retry}
            </Button>
          }
        />
      ) : (
        <Card className="flex flex-col gap-4">
          <div
            className={`grid grid-cols-1 gap-4 ${
              state.showThirdColumn ? 'md:grid-cols-3' : 'md:grid-cols-2'
            }`}
          >
            {visibleIndexes.map((slotIndex) => {
              const currentId = state.slots[slotIndex] ?? '';
              const selectedProduct = state.selectedProducts[slotIndex];
              const otherSelected = new Set(
                state.slots.filter((id, idx): id is string => Boolean(id) && idx !== slotIndex),
              );
              const filteredCpus =
                state.lockedCategory === 'gpu'
                  ? []
                  : state.cpus.filter((c) => !otherSelected.has(c.id) || c.id === currentId);
              const filteredGpus =
                state.lockedCategory === 'cpu'
                  ? []
                  : state.gpus.filter((g) => !otherSelected.has(g.id) || g.id === currentId);
              const placeholder = state.lockedCategory
                ? VI_MESSAGES.tools.compare.slotPlaceholderSameCategory(state.lockedCategory)
                : VI_MESSAGES.tools.compare.slotPlaceholder;
              const groups: SearchableSelectGroup[] = [
                ...(filteredCpus.length > 0
                  ? [
                      {
                        id: 'cpu',
                        label: VI_MESSAGES.tools.compare.cpuGroupLabel,
                        options: filteredCpus.map((cpu) => ({
                          value: cpu.id,
                          label: cpu.name,
                          meta: `${cpu.vendor.toUpperCase()} | ${formatVnd(cpu.priceVnd)}`,
                          keywords: cpu.vendor,
                        })),
                      },
                    ]
                  : []),
                ...(filteredGpus.length > 0
                  ? [
                      {
                        id: 'gpu',
                        label: VI_MESSAGES.tools.compare.gpuGroupLabel,
                        options: filteredGpus.map((gpu) => ({
                          value: gpu.id,
                          label: gpu.name,
                          meta: `${gpu.vendor.toUpperCase()}${gpu.aibBrand ? ` / ${gpu.aibBrand}` : ''} | ${formatVnd(gpu.priceVnd)}`,
                          keywords: `${gpu.vendor} ${gpu.aibBrand ?? ''}`,
                        })),
                      },
                    ]
                  : []),
              ];

              return (
                <div key={slotIndex} className="flex flex-col gap-2">
                  <SearchableSelect
                    label={VI_MESSAGES.tools.compare.slotLabel(slotIndex + 1)}
                    value={currentId}
                    groups={groups}
                    placeholder={placeholder}
                    searchPlaceholder={VI_MESSAGES.tools.compare.slotSearchPlaceholder}
                    triggerTestId={TEST_IDS.compare.slotSelect(slotIndex)}
                    searchTestId={TEST_IDS.compare.slotSearch(slotIndex)}
                    optionTestId={(id) => TEST_IDS.compare.slotOption(slotIndex, id)}
                    onChange={(nextId) => actions.onSelectSlot(slotIndex, nextId)}
                  />

                  {selectedProduct ? (
                    <div
                      data-testid={TEST_IDS.compare.slotPreview(slotIndex)}
                      className="flex items-center gap-3 rounded-control border-2 border-border-strong bg-surface-subtle p-2.5"
                    >
                      <Link href={`/products/${selectedProduct.id}`} className="shrink-0">
                        <ProductImage
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="h-20 w-20 object-contain p-1"
                        />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant={vendorBadgeVariant(selectedProduct.vendor)}>
                            {selectedProduct.vendor.toUpperCase()}
                          </Badge>
                          {selectedProduct.aibBrand ? (
                            <Badge variant="aib">{selectedProduct.aibBrand}</Badge>
                          ) : null}
                          {selectedProduct.isLimitedEdition ? (
                            <Badge variant="warning">{VI_MESSAGES.catalog.limitedEditionBadge}</Badge>
                          ) : null}
                        </div>
                        <Link
                          href={`/products/${selectedProduct.id}`}
                          className="line-clamp-2 text-sm font-semibold text-ink hover:text-accent-ink"
                        >
                          {selectedProduct.name}
                        </Link>
                        <p className="font-mono text-sm font-bold tabular-nums text-ink">
                          {formatVnd(selectedProduct.priceVnd)}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {currentId || slotIndex === 2 ? (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={TEST_IDS.compare.slotClear(slotIndex)}
                        onClick={() => actions.onClearSlot(slotIndex)}
                      >
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>
                          {slotIndex === 2 && !currentId
                            ? VI_MESSAGES.tools.compare.removeColumn
                            : VI_MESSAGES.common.reset}
                        </span>
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {state.isLoadingCompare ? (
        <Spinner />
      ) : state.compareErrorMessage ? (
        <EmptyState
          title={VI_MESSAGES.tools.compare.errorTitle}
          description={state.compareErrorMessage}
          action={
            <Link href="/cpu" data-testid={TEST_IDS.compare.errorBack}>
              <Button variant="primary">{VI_MESSAGES.common.backToStore}</Button>
            </Link>
          }
        />
      ) : state.data ? (
        <>
          <ResponsiveTableWrapper label={VI_MESSAGES.tools.compare.title}>
            <table
              data-testid={TEST_IDS.compare.table}
              className="w-full min-w-[540px] border-collapse text-left text-sm"
            >
              <thead>
                <tr className="border-b-2 border-border-strong bg-surface-subtle">
                  <th className="w-48 px-3 py-3 font-semibold text-ink-muted">
                    {VI_MESSAGES.tools.compare.criterionColumn}
                  </th>
                  {state.data.products.map((product) => (
                    <th
                      key={product.id}
                      className="min-w-48 px-3 py-3 align-top font-semibold text-ink"
                    >
                      <div className="flex flex-col items-start gap-2.5">
                        <Link href={`/products/${product.id}`} className="block w-full max-w-60">
                          <ZoomableImageFrame
                            zoomScale={1.75}
                            className="flex aspect-square w-full items-center justify-center rounded-card border-2 border-border-strong bg-white"
                          >
                            <ProductImage
                              src={product.imageUrl}
                              alt={product.name}
                              testId={TEST_IDS.compare.headerImage(product.id)}
                              className="h-full w-full object-contain p-2"
                            />
                          </ZoomableImageFrame>
                        </Link>
                        <Link href={`/products/${product.id}`} className="hover:text-accent-ink">
                          {product.name}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.data.rows.map((row) => (
                  <tr key={row.key} className="border-b border-border last:border-b-0">
                    <th className="bg-surface-subtle/60 px-3 py-2.5 font-medium text-ink-muted">
                      {row.label}
                    </th>
                    {row.cells.map((cell, idx) => {
                      const product = state.data!.products[idx];
                      return (
                        <td
                          key={`${row.key}-${product.id}`}
                          data-testid={TEST_IDS.compare.cell(row.key, product.id)}
                          className={`px-3 py-2.5 font-mono tabular-nums ${
                            cell.highlighted
                              ? 'bg-highlight font-semibold text-highlight-fg'
                              : 'text-ink'
                          }`}
                        >
                          {cell.display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>

          <Card className="flex flex-col gap-2 bg-surface-subtle text-xs text-ink-muted">
            {state.data.notes.map((note, index) => (
              <p key={index}>{note}</p>
            ))}
          </Card>
        </>
      ) : (
        <EmptyState title={VI_MESSAGES.tools.compare.pickTwoPrompt} />
      )}
    </div>
  );
}
