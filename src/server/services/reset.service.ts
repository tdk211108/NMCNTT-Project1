import 'server-only';

import { sql } from 'drizzle-orm';
import type { AdminResetResponse } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { orders } from '../db/schema';
import {
  seedCatalog,
  TRUNCATE_SAMPLE_TABLES_SQL,
  type SeedStorageConfig,
} from '../db/seed/seed-catalog';
import { purgeAllUploadedImages, type StoragePurgeResult } from '../storage/supabase-storage';

export async function resetSampleData(
  db: DbClient = getDb(),
  storagePurger: () => Promise<StoragePurgeResult> = purgeAllUploadedImages,
  storageOverride?: Partial<SeedStorageConfig>,
): Promise<AdminResetResponse> {
  const dbResult = await db.transaction(async (tx) => {
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(orders);

    await tx.execute(sql.raw(TRUNCATE_SAMPLE_TABLES_SQL));

    const seeded = await seedCatalog(tx, storageOverride);

    return {
      ordersDeleted: count ?? 0,
      productsRestored: seeded.productsRestored,
    };
  });

  const { imagesPurged, warnings } = await storagePurger();

  return {
    ordersDeleted: dbResult.ordersDeleted,
    productsRestored: dbResult.productsRestored,
    imagesPurged,
    warnings,
  };
}
