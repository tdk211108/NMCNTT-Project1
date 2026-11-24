'use client';

import { useState } from 'react';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Card } from '@/components/ui/Card';
import { CatalogPagination } from '@/components/ui/CatalogPagination';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { Input } from '@/components/ui/Input';
import { ProductImage } from '@/components/ui/ProductImage';
import { Select } from '@/components/ui/Select';
import { ResponsiveTableWrapper } from '@/components/ui/Table';
import { formatVnd } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { CpuVendor } from '@/shared/types';
import type { useAdminProductsController } from '../useAdminProductsController';

export type AdminProductsViewProps = ReturnType<typeof useAdminProductsController>;

export function AdminProductsView({ state, actions }: AdminProductsViewProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{VI_MESSAGES.admin.navProducts}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            cyber={false}
            sfx="toggle"
            variant={state.category === 'cpu' ? 'primary' : 'outline'}
            data-testid={TEST_IDS.admin.productCategoryTab('cpu')}
            onClick={() => actions.onChangeCategory('cpu')}
          >
            {VI_MESSAGES.nav.cpu}
          </Button>
          <Button
            size="sm"
            cyber={false}
            sfx="toggle"
            variant={state.category === 'gpu' ? 'primary' : 'outline'}
            data-testid={TEST_IDS.admin.productCategoryTab('gpu')}
            onClick={() => actions.onChangeCategory('gpu')}
          >
            {VI_MESSAGES.nav.gpu}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            data-testid={TEST_IDS.admin.productAdd}
            onClick={actions.onStartCreate}
          >
            {VI_MESSAGES.admin.addNewButton}
          </Button>
        </div>
      </div>

      {state.form ? (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              actions.onSave();
            }}
            className="flex flex-col gap-4"
          >
            <h2 className="text-lg font-semibold text-ink">
              {state.form.mode === 'create' ? VI_MESSAGES.admin.addNewButton : VI_MESSAGES.common.edit}{' '}
              ({state.form.category.toUpperCase()})
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Tên sản phẩm"
                required
                value={state.form.name}
                onChange={(e) => actions.onUpdateFormField('name', e.target.value)}
              />
              <Input
                type="number"
                label="Giá bán (VND)"
                required
                value={state.form.priceVnd}
                onChange={(e) => actions.onUpdateFormField('priceVnd', e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-control border border-border bg-surface-subtle p-3">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="font-medium text-ink">Hình ảnh:</span>
                {(['none', 'url', 'upload'] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-1.5 text-ink">
                    <input
                      type="radio"
                      name="imageMode"
                      checked={state.form?.imageMode === mode}
                      onChange={() => actions.onUpdateFormField('imageMode', mode)}
                    />
                    <span>
                      {mode === 'none'
                        ? VI_MESSAGES.admin.imageModeNone
                        : mode === 'url'
                          ? VI_MESSAGES.admin.imageModeUrl
                          : VI_MESSAGES.admin.imageModeUpload}
                    </span>
                  </label>
                ))}
              </div>

              {state.form.imageMode === 'url' ? (
                <Input
                  label="Image URL (https://)"
                  value={state.form.imageUrl}
                  data-testid={TEST_IDS.admin.imageUrl}
                  onChange={(e) => actions.onUpdateFormField('imageUrl', e.target.value)}
                />
              ) : null}

              {state.form.imageMode === 'upload' ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    data-testid={TEST_IDS.admin.imageUpload}
                    disabled={state.isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) actions.onUploadFile(file);
                    }}
                    className="text-sm text-ink"
                  />
                  {state.form.uploadedPreviewUrl ? (
                    <ProductImage
                      src={state.form.uploadedPreviewUrl}
                      alt="Preview"
                      className="h-24 w-24 object-contain"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {state.form.category === 'cpu' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Select
                  label="Hãng chip"
                  value={state.form.vendor}
                  onChange={(e) =>
                    actions.onUpdateFormField('vendor', e.target.value as CpuVendor)
                  }
                >
                  <option value="intel">Intel</option>
                  <option value="amd">AMD</option>
                </Select>
                <Input
                  label="Kiến trúc"
                  required
                  value={state.form.architecture}
                  onChange={(e) => actions.onUpdateFormField('architecture', e.target.value)}
                />
                <div>
                  <Input
                    label="Socket"
                    required
                    list="admin-socket-list"
                    value={state.form.socket}
                    onChange={(e) => actions.onUpdateFormField('socket', e.target.value)}
                  />
                  <datalist id="admin-socket-list">
                    {state.existingSockets.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <Input
                  label="Tiến trình"
                  required
                  value={state.form.processNode}
                  onChange={(e) => actions.onUpdateFormField('processNode', e.target.value)}
                />
                <Input
                  type="number"
                  label="Tổng số nhân"
                  required
                  value={state.form.coresTotal}
                  onChange={(e) => actions.onUpdateFormField('coresTotal', e.target.value)}
                />
                <Input
                  type="number"
                  label="Tổng số luồng"
                  required
                  value={state.form.threadsTotal}
                  onChange={(e) => actions.onUpdateFormField('threadsTotal', e.target.value)}
                />
                <Input
                  type="number"
                  label="P-Core (để trống nếu không hybrid)"
                  value={state.form.pCores}
                  onChange={(e) => actions.onUpdateFormField('pCores', e.target.value)}
                />
                <Input
                  type="number"
                  label="E-Core (để trống nếu không hybrid)"
                  value={state.form.eCores}
                  onChange={(e) => actions.onUpdateFormField('eCores', e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  label="Base Clock (GHz)"
                  required
                  value={state.form.baseClockGhz}
                  onChange={(e) => actions.onUpdateFormField('baseClockGhz', e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  label="Boost Clock (GHz)"
                  required
                  value={state.form.boostClockGhz}
                  onChange={(e) => actions.onUpdateFormField('boostClockGhz', e.target.value)}
                />
                <Input
                  label="Cache Text"
                  required
                  value={state.form.cacheText}
                  onChange={(e) => actions.onUpdateFormField('cacheText', e.target.value)}
                />
                <Input
                  type="number"
                  step="0.1"
                  label="L3 Cache (MB)"
                  required
                  value={state.form.l3CacheMb}
                  onChange={(e) => actions.onUpdateFormField('l3CacheMb', e.target.value)}
                />
                <Input
                  type="number"
                  label="Base TDP (W)"
                  required
                  value={state.form.tdpW}
                  onChange={(e) => actions.onUpdateFormField('tdpW', e.target.value)}
                />
                <Input
                  type="number"
                  label="PSU Power (W)"
                  required
                  value={state.form.psuPowerW}
                  onChange={(e) => actions.onUpdateFormField('psuPowerW', e.target.value)}
                />
                <Input
                  label="RAM Support"
                  required
                  value={state.form.ramSupport}
                  onChange={(e) => actions.onUpdateFormField('ramSupport', e.target.value)}
                />
                <Input
                  type="number"
                  label="PassMark Raw"
                  required
                  value={state.form.passmarkRaw}
                  onChange={(e) => actions.onUpdateFormField('passmarkRaw', e.target.value)}
                />
                <Input
                  label="PassMark Source"
                  required
                  value={state.form.passmarkSource}
                  onChange={(e) => actions.onUpdateFormField('passmarkSource', e.target.value)}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Select
                    label="Dòng GPU cơ sở (Retail Series)"
                    required
                    value={state.form.seriesId}
                    onChange={(e) => actions.onUpdateFormField('seriesId', e.target.value)}
                  >
                    {state.retailSeries.map((series) => (
                      <option key={series.id} value={series.id}>
                        {series.name} ({series.vramGb} GB)
                      </option>
                    ))}
                  </Select>
                  <div>
                    <Input
                      label="Hãng AIB"
                      required
                      list="admin-aib-list"
                      value={state.form.aibBrand}
                      onChange={(e) => actions.onUpdateFormField('aibBrand', e.target.value)}
                    />
                    <datalist id="admin-aib-list">
                      {state.existingAibBrands.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  </div>
                  <Input
                    type="number"
                    label="Chiều dài (mm)"
                    required
                    value={state.form.lengthMm}
                    onChange={(e) => actions.onUpdateFormField('lengthMm', e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.1"
                    label="Độ dày (slots)"
                    required
                    value={state.form.slotThickness}
                    onChange={(e) => actions.onUpdateFormField('slotThickness', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Cổng HDMI"
                    required
                    value={state.form.hdmiCount}
                    onChange={(e) => actions.onUpdateFormField('hdmiCount', e.target.value)}
                  />
                  <Input
                    type="number"
                    label="Cổng DisplayPort"
                    required
                    value={state.form.dpCount}
                    onChange={(e) => actions.onUpdateFormField('dpCount', e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={state.form.isLimitedEdition}
                    onChange={(e) =>
                      actions.onUpdateFormField('isLimitedEdition', e.target.checked)
                    }
                  />
                  <span>{VI_MESSAGES.catalog.limitedEditionBadge}</span>
                </label>

                {state.selectedSeries ? (
                  <p className="rounded-control border border-border bg-surface-subtle px-3 py-2 text-xs text-ink-muted">
                    Thông số kế thừa từ {state.selectedSeries.name}: VRAM{' '}
                    {state.selectedSeries.vramGb} GB, TBP {state.selectedSeries.tbpW} W, Cores{' '}
                    {state.selectedSeries.cores}, Boost {state.selectedSeries.boostClockMhz} MHz,
                    PassMark {state.selectedSeries.passmarkRaw}.
                  </p>
                ) : null}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                data-testid={TEST_IDS.admin.productCancel}
                onClick={actions.onCancelForm}
              >
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={state.isSaving}
                data-testid={TEST_IDS.admin.productSave}
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
        <div
          className={`flex flex-col gap-4 transition-opacity ${state.isFetching && !state.isLoading ? 'opacity-65' : ''}`}
        >
          <ResponsiveTableWrapper label={VI_MESSAGES.admin.navProducts}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-subtle">
                  <th className="px-3 py-2.5 font-semibold text-ink-muted">ID</th>
                  <th className="px-3 py-2.5 font-semibold text-ink-muted">Tên</th>
                  <th className="px-3 py-2.5 font-semibold text-ink-muted">Giá</th>
                  <th className="px-3 py-2.5 font-semibold text-ink-muted">Thông số chính</th>
                  <th className="px-3 py-2.5 font-semibold text-ink-muted">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.items.map((item) => (
                  <tr
                    key={item.id}
                    data-testid={TEST_IDS.admin.productRow(item.id)}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-ink-muted">{item.id}</td>
                    <td className="px-3 py-2.5 font-medium text-ink">{item.name}</td>
                    <td className="px-3 py-2.5 text-primary">{formatVnd(item.priceVnd)}</td>
                    <td className="px-3 py-2.5 text-xs text-ink-muted">
                      {item.category === 'cpu'
                        ? `${item.vendor.toUpperCase()} | ${item.socket} | ${item.coresTotal}C/${item.threadsTotal}T`
                        : `${item.series.name} | ${item.aibBrand} | ${item.series.vramGb} GB${
                            item.isLimitedEdition ? ' | Limited Edition' : ''
                          }`}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={TEST_IDS.admin.productEdit(item.id)}
                          onClick={() => actions.onStartEdit(item)}
                        >
                          {VI_MESSAGES.common.edit}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={state.isDeleting}
                          data-testid={TEST_IDS.admin.productDelete(item.id)}
                          onClick={() => setPendingDeleteId(item.id)}
                        >
                          {VI_MESSAGES.common.delete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ResponsiveTableWrapper>

          <CatalogPagination
            scope={`admin-${state.category}`}
            currentPage={state.page}
            totalItems={state.total}
            pageSize={state.pageSize}
            onPageChange={actions.onChangePage}
          />
        </div>
      )}

      <AlertDialog
        open={pendingDeleteId !== null}
        title={VI_MESSAGES.admin.deleteConfirmTitle}
        description={VI_MESSAGES.admin.deleteConfirmBody}
        confirmLabel={VI_MESSAGES.common.delete}
        cancelLabel={VI_MESSAGES.common.cancel}
        isConfirming={state.isDeleting}
        confirmTestId={TEST_IDS.admin.deleteConfirm}
        cancelTestId={TEST_IDS.admin.deleteCancel}
        onConfirm={() => {
          if (pendingDeleteId) {
            actions.onDelete(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
