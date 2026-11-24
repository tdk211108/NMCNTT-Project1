'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch, apiUpload } from '@/lib/api-client';
import { ADMIN_PRODUCTS_PAGE_SIZE } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ImageRef } from '@/shared/schemas/admin';
import type {
  AdminCpuListItem,
  AdminGpuSeriesItem,
  AdminGpuVariantListItem,
  AdminImageUploadResponse,
  AdminProductListItem,
  AdminProductPageResponse,
  Category,
  CpuVendor,
} from '@/shared/types';
import { handleAdminApiError } from './admin-error';
import { ADMIN_SESSION_QUERY_KEY } from './useAdminSession';

export interface ProductFormState {
  mode: 'create' | 'edit';
  editingId: string | null;
  category: Category;
  name: string;
  priceVnd: string;
  imageMode: 'none' | 'url' | 'upload';
  imageUrl: string;
  uploadedStoragePath: string;
  uploadedPreviewUrl: string;
  // CPU fields
  vendor: CpuVendor;
  architecture: string;
  socket: string;
  processNode: string;
  coresTotal: string;
  threadsTotal: string;
  pCores: string;
  eCores: string;
  baseClockGhz: string;
  boostClockGhz: string;
  cacheText: string;
  l3CacheMb: string;
  tdpW: string;
  psuPowerW: string;
  ramSupport: string;
  passmarkRaw: string;
  passmarkSource: string;
  // GPU variant fields
  seriesId: string;
  aibBrand: string;
  isLimitedEdition: boolean;
  lengthMm: string;
  slotThickness: string;
  hdmiCount: string;
  dpCount: string;
}

function createEmptyProductForm(category: Category, defaultSeriesId = ''): ProductFormState {
  return {
    mode: 'create',
    editingId: null,
    category,
    name: '',
    priceVnd: '',
    imageMode: 'none',
    imageUrl: '',
    uploadedStoragePath: '',
    uploadedPreviewUrl: '',
    vendor: 'intel',
    architecture: '',
    socket: '',
    processNode: '',
    coresTotal: '',
    threadsTotal: '',
    pCores: '',
    eCores: '',
    baseClockGhz: '',
    boostClockGhz: '',
    cacheText: '',
    l3CacheMb: '',
    tdpW: '',
    psuPowerW: '',
    ramSupport: '',
    passmarkRaw: '',
    passmarkSource: 'PassMark',
    seriesId: defaultSeriesId,
    aibBrand: '',
    isLimitedEdition: false,
    lengthMm: '',
    slotThickness: '',
    hdmiCount: '',
    dpCount: '',
  };
}

function formFromItem(item: AdminProductListItem): ProductFormState {
  const isUploaded = Boolean(item.imageStoragePath?.startsWith('uploads/'));
  const imageMode: ProductFormState['imageMode'] = isUploaded
    ? 'upload'
    : item.imageUrl
      ? 'url'
      : 'none';

  const base = createEmptyProductForm(item.category);
  const shared = {
    ...base,
    mode: 'edit' as const,
    editingId: item.id,
    name: item.name,
    priceVnd: String(item.priceVnd),
    imageMode,
    imageUrl: !isUploaded && item.imageUrl ? item.imageUrl : '',
    uploadedStoragePath: isUploaded && item.imageStoragePath ? item.imageStoragePath : '',
    uploadedPreviewUrl: isUploaded && item.imageUrl ? item.imageUrl : '',
  };

  if (item.category === 'cpu') {
    const cpu = item as AdminCpuListItem;
    return {
      ...shared,
      vendor: cpu.vendor,
      architecture: cpu.architecture,
      socket: cpu.socket,
      processNode: cpu.processNode,
      coresTotal: String(cpu.coresTotal),
      threadsTotal: String(cpu.threadsTotal),
      pCores: cpu.pCores !== null ? String(cpu.pCores) : '',
      eCores: cpu.eCores !== null ? String(cpu.eCores) : '',
      baseClockGhz: String(cpu.baseClockGhz),
      boostClockGhz: String(cpu.boostClockGhz),
      cacheText: cpu.cacheText,
      l3CacheMb: String(cpu.l3CacheMb),
      tdpW: String(cpu.tdpW),
      psuPowerW: String(cpu.psuPowerW),
      ramSupport: cpu.ramSupport,
      passmarkRaw: String(cpu.passmarkRaw),
      passmarkSource: cpu.passmarkSource,
    };
  }

  const gpu = item as AdminGpuVariantListItem;
  return {
    ...shared,
    seriesId: gpu.seriesId,
    aibBrand: gpu.aibBrand,
    isLimitedEdition: gpu.isLimitedEdition,
    lengthMm: String(gpu.lengthMm),
    slotThickness: String(gpu.slotThickness),
    hdmiCount: String(gpu.hdmiCount),
    dpCount: String(gpu.dpCount),
  };
}

function buildImageRef(form: ProductFormState): ImageRef {
  if (form.imageMode === 'url' && form.imageUrl.trim()) {
    return { kind: 'url', url: form.imageUrl.trim() };
  }
  if (form.imageMode === 'upload' && form.uploadedStoragePath) {
    return { kind: 'upload', storagePath: form.uploadedStoragePath };
  }
  return { kind: 'none' };
}

function buildProductPayload(form: ProductFormState): Record<string, unknown> {
  const image = buildImageRef(form);
  if (form.category === 'cpu') {
    const payload = {
      name: form.name,
      priceVnd: Number(form.priceVnd),
      image,
      vendor: form.vendor,
      architecture: form.architecture,
      socket: form.socket,
      processNode: form.processNode,
      coresTotal: Number(form.coresTotal),
      threadsTotal: Number(form.threadsTotal),
      pCores: form.pCores.trim() === '' ? null : Number(form.pCores),
      eCores: form.eCores.trim() === '' ? null : Number(form.eCores),
      baseClockGhz: Number(form.baseClockGhz),
      boostClockGhz: Number(form.boostClockGhz),
      cacheText: form.cacheText,
      l3CacheMb: Number(form.l3CacheMb),
      tdpW: Number(form.tdpW),
      psuPowerW: Number(form.psuPowerW),
      ramSupport: form.ramSupport,
      passmarkRaw: Number(form.passmarkRaw),
      passmarkSource: form.passmarkSource || 'PassMark',
    };
    return form.mode === 'create' ? { category: 'cpu', ...payload } : payload;
  }

  const payload = {
    seriesId: form.seriesId,
    name: form.name,
    aibBrand: form.aibBrand,
    isLimitedEdition: form.isLimitedEdition,
    priceVnd: Number(form.priceVnd),
    image,
    lengthMm: Number(form.lengthMm),
    slotThickness: Number(form.slotThickness),
    hdmiCount: Number(form.hdmiCount),
    dpCount: Number(form.dpCount),
  };
  return form.mode === 'create' ? { category: 'gpu', ...payload } : payload;
}

export function useAdminProductsController() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<Category>('cpu');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<ProductFormState | null>(null);

  const productsQuery = useQuery({
    queryKey: ['admin', 'products', category, page, ADMIN_PRODUCTS_PAGE_SIZE],
    queryFn: () =>
      apiFetch<AdminProductPageResponse>(
        `/api/admin/products?category=${category}&page=${page}&pageSize=${ADMIN_PRODUCTS_PAGE_SIZE}`,
      ),
    placeholderData: keepPreviousData,
  });

  const retailSeriesQuery = useQuery({
    queryKey: ['admin', 'gpu-series', 'retail'],
    queryFn: () => apiFetch<AdminGpuSeriesItem[]>('/api/admin/gpu-series?kind=retail'),
  });

  const invalidateSession = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiUpload<AdminImageUploadResponse>('/api/admin/images', file),
    onSuccess: (res) => {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              imageMode: 'upload',
              uploadedStoragePath: res.storagePath,
              uploadedPreviewUrl: res.url,
            }
          : prev,
      );
      showToast(VI_MESSAGES.admin.uploadSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  const saveMutation = useMutation({
    mutationFn: async (currentForm: ProductFormState) => {
      const payload = buildProductPayload(currentForm);
      if (currentForm.mode === 'create') {
        return apiFetch<AdminProductListItem>('/api/admin/products', {
          method: 'POST',
          json: payload,
        });
      }
      return apiFetch<AdminProductListItem>(
        `/api/admin/products/${encodeURIComponent(currentForm.editingId!)}`,
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    onSuccess: async () => {
      setForm(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast(VI_MESSAGES.admin.saveSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast(VI_MESSAGES.admin.deleteSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  const items = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);
  const retailSeries = useMemo(() => retailSeriesQuery.data ?? [], [retailSeriesQuery.data]);

  const existingSockets = useMemo(
    () => productsQuery.data?.existingSockets ?? [],
    [productsQuery.data],
  );

  const existingAibBrands = useMemo(
    () => productsQuery.data?.existingAibBrands ?? [],
    [productsQuery.data],
  );

  const selectedSeries =
    form?.category === 'gpu'
      ? retailSeries.find((s) => s.id === form.seriesId) ?? null
      : null;

  return {
    state: {
      category,
      items,
      total: productsQuery.data?.total ?? 0,
      page: productsQuery.data?.page ?? page,
      pageSize: productsQuery.data?.pageSize ?? ADMIN_PRODUCTS_PAGE_SIZE,
      retailSeries,
      selectedSeries,
      existingSockets,
      existingAibBrands,
      form,
      isLoading: productsQuery.isLoading,
      isFetching: productsQuery.isFetching,
      isUploading: uploadMutation.isPending,
      isSaving: saveMutation.isPending,
      isDeleting: deleteMutation.isPending,
    },
    actions: {
      onChangeCategory: (nextCat: Category) => {
        setCategory(nextCat);
        setPage(1);
        setForm(null);
      },
      onChangePage: (nextPage: number) => setPage(nextPage),
      onStartCreate: () =>
        setForm(createEmptyProductForm(category, retailSeries[0]?.id ?? '')),
      onStartEdit: (item: AdminProductListItem) => setForm(formFromItem(item)),
      onCancelForm: () => setForm(null),
      onUpdateFormField: <K extends keyof ProductFormState>(
        key: K,
        value: ProductFormState[K],
      ) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev)),
      onUploadFile: (file: File) => uploadMutation.mutate(file),
      onSave: () => {
        if (!form || saveMutation.isPending) return;
        saveMutation.mutate(form);
      },
      onDelete: (id: string) => deleteMutation.mutate(id),
    },
  };
}
