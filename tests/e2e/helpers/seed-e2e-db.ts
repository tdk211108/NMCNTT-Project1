import path from 'node:path';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDbConnection } from '../../../src/server/db/client';
import { seedCatalog } from '../../../src/server/db/seed/seed-catalog';
import {
  E2E_DB_URL,
  E2E_SUPABASE_BUCKET,
  E2E_SUPABASE_URL,
} from './e2e-constants';

const TRUNCATE_E2E_ALL_SQL =
  'TRUNCATE TABLE order_status_events, order_items, orders, gpu_variants, cpu_specs, products, gpu_series, legacy_cpus, auth_failures, email_otps, oauth_accounts, users RESTART IDENTITY CASCADE';

function assertSafeLocalDbUrl(url: string): string {
  const trimmed = url.trim();
  const isLocalHost = trimmed.includes('127.0.0.1') || trimmed.includes('localhost');
  if (
    !trimmed ||
    !isLocalHost ||
    trimmed.includes('supabase.co') ||
    trimmed.includes('supabase.com')
  ) {
    throw new Error(`Refusing to seed unsafe or non-local E2E database URL: "${trimmed}"`);
  }
  return trimmed;
}

async function main() {
  const dbUrl = assertSafeLocalDbUrl(process.env.E2E_DATABASE_URL ?? E2E_DB_URL);
  const bundle = createDbConnection(dbUrl, { max: 2, idleTimeoutSeconds: 5 });

  try {
    await migrate(bundle.db, {
      migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
    });

    await bundle.db.transaction(async (tx) => {
      await tx.execute(sql.raw(TRUNCATE_E2E_ALL_SQL));
      await seedCatalog(tx, {
        supabaseUrl: E2E_SUPABASE_URL,
        bucket: E2E_SUPABASE_BUCKET,
      });
    });

    console.info('[e2e-seed] Migrated and seeded local Docker E2E database successfully.');
  } finally {
    await bundle.sql.end();
  }
}

main().catch((error) => {
  console.error('[e2e-seed] Failed:', error);
  process.exit(1);
});
