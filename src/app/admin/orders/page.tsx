'use client';

import { AdminOrdersView } from '@/features/admin/components/AdminOrdersView';
import { useAdminOrdersController } from '@/features/admin/useAdminOrdersController';

export default function AdminOrdersPage() {
  const vm = useAdminOrdersController();
  return <AdminOrdersView {...vm} />;
}
