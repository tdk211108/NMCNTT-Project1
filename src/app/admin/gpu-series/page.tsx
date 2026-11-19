'use client';

import { AdminGpuSeriesView } from '@/features/admin/components/AdminGpuSeriesView';
import { useAdminGpuSeriesController } from '@/features/admin/useAdminGpuSeriesController';

export default function AdminGpuSeriesPage() {
  const vm = useAdminGpuSeriesController();
  return <AdminGpuSeriesView {...vm} />;
}
