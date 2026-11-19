'use client';

import { AdminLegacyCpusView } from '@/features/admin/components/AdminLegacyCpusView';
import { useAdminLegacyCpusController } from '@/features/admin/useAdminLegacyCpusController';

export default function AdminLegacyCpusPage() {
  const vm = useAdminLegacyCpusController();
  return <AdminLegacyCpusView {...vm} />;
}
