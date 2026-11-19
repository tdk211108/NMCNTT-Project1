'use client';

import { AdminDashboardView } from '@/features/admin/components/AdminDashboardView';
import { useAdminDashboardController } from '@/features/admin/useAdminDashboardController';

export default function AdminDashboardPage() {
  const vm = useAdminDashboardController();
  return <AdminDashboardView {...vm} />;
}
