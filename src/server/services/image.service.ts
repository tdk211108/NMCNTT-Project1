import 'server-only';

import type { AdminImageUploadResponse } from '@/shared/types';
import { uploadAdminImage } from '../storage/supabase-storage';

export async function uploadProductImage(file: File): Promise<AdminImageUploadResponse> {
  return uploadAdminImage(file);
}
