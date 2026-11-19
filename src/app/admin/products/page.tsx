'use client';

import { AdminProductsView } from '@/features/admin/components/AdminProductsView';
import { useAdminProductsController } from '@/features/admin/useAdminProductsController';

export default function AdminProductsPage() {
  const vm = useAdminProductsController();
  return <AdminProductsView {...vm} />;
}
