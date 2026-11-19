import 'server-only';

import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { MAX_IMAGE_BYTES, UPLOAD_IMAGE_PREFIX } from '@/shared/constants';
import { AppError } from '../http/errors';

export interface StorageConfig {
  supabaseUrl: string;
  secretKey: string;
  bucket: string;
}

export interface SniffedImage {
  ext: 'jpg' | 'png' | 'webp';
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function resolvePublicStorageConfig(): Pick<StorageConfig, 'supabaseUrl' | 'bucket'> {
  const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images').trim();

  if (!supabaseUrl || !bucket) {
    throw new AppError('INTERNAL', {
      status: 500,
      message: 'Cấu hình lưu trữ ảnh Supabase chưa đầy đủ.',
    });
  }

  return { supabaseUrl, bucket };
}

export function resolveStorageConfig(): StorageConfig {
  const { supabaseUrl, bucket } = resolvePublicStorageConfig();
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? '').trim();

  if (!secretKey) {
    throw new AppError('INTERNAL', {
      status: 500,
      message: 'Cấu hình lưu trữ ảnh Supabase chưa đầy đủ.',
    });
  }

  return { supabaseUrl, secretKey, bucket };
}

export function buildPublicObjectUrl(
  storagePath: string,
  config?: Pick<StorageConfig, 'supabaseUrl' | 'bucket'>,
): string {
  const resolved = config ?? resolvePublicStorageConfig();
  return `${resolved.supabaseUrl}/storage/v1/object/public/${resolved.bucket}/${storagePath}`;
}

export function sniffImageMagicBytes(buffer: Buffer): SniffedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', contentType: 'image/jpeg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: 'png', contentType: 'image/png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', contentType: 'image/webp' };
  }
  return null;
}

function createStorageClient(config: StorageConfig): SupabaseClient {
  return createClient(config.supabaseUrl, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function uploadAdminImage(
  file: File,
): Promise<{ url: string; storagePath: string }> {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new AppError('IMAGE_INVALID');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageMagicBytes(buffer);
  if (!sniffed) {
    throw new AppError('IMAGE_INVALID');
  }

  const config = resolveStorageConfig();
  const client = createStorageClient(config);
  const storagePath = `${UPLOAD_IMAGE_PREFIX}${randomUUID()}.${sniffed.ext}`;

  const { error } = await client.storage.from(config.bucket).upload(storagePath, buffer, {
    contentType: sniffed.contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    console.error('[storage] Upload failed:', error);
    throw new AppError('INTERNAL', { status: 500 });
  }

  return {
    url: buildPublicObjectUrl(storagePath, config),
    storagePath,
  };
}

/**
 * Deletes a previously uploaded object under `uploads/`. Never deletes `seed/` files.
 */
export async function deleteUploadedImageBestEffort(storagePath: string | null): Promise<void> {
  if (!storagePath || !storagePath.startsWith(UPLOAD_IMAGE_PREFIX)) {
    return;
  }
  try {
    const config = resolveStorageConfig();
    const client = createStorageClient(config);
    const { error } = await client.storage.from(config.bucket).remove([storagePath]);
    if (error) {
      console.warn(`[storage] Best-effort delete failed for ${storagePath}:`, error.message);
    }
  } catch (err) {
    console.warn(`[storage] Best-effort delete threw for ${storagePath}:`, err);
  }
}

export interface StoragePurgeResult {
  imagesPurged: number;
  warnings: string[];
}

export async function purgeAllUploadedImages(): Promise<StoragePurgeResult> {
  const warnings: string[] = [];
  let imagesPurged = 0;

  let config: StorageConfig;
  try {
    config = resolveStorageConfig();
  } catch (err) {
    warnings.push(err instanceof Error ? err.message : 'Storage config missing');
    return { imagesPurged, warnings };
  }

  const client = createStorageClient(config);
  const prefixFolder = UPLOAD_IMAGE_PREFIX.replace(/\/+$/, '');
  const pathsToDelete: string[] = [];

  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.storage.from(config.bucket).list(prefixFolder, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      warnings.push(`Không thể liệt kê tệp trong ${prefixFolder}/: ${error.message}`);
      return { imagesPurged, warnings };
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const entry of data) {
      if (entry.id !== null && entry.name && entry.name !== '.emptyFolderPlaceholder') {
        pathsToDelete.push(`${prefixFolder}/${entry.name}`);
      }
    }

    if (data.length < 1000) {
      break;
    }
  }

  for (let i = 0; i < pathsToDelete.length; i += 100) {
    const batch = pathsToDelete.slice(i, i + 100);
    const { error } = await client.storage.from(config.bucket).remove(batch);
    if (error) {
      warnings.push(`Lỗi xóa lô ảnh (${batch.length} tệp): ${error.message}`);
    } else {
      imagesPurged += batch.length;
    }
  }

  return { imagesPurged, warnings };
}
