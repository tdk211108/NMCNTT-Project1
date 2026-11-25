import path from 'node:path';
import { sql as rawSql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createDbConnection, type DbClient, type DbConnectionBundle } from '@/server/db/client';
import { seedCatalog, TRUNCATE_SAMPLE_TABLES_SQL } from '@/server/db/seed/seed-catalog';

const DEFAULT_TEST_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:5433/techcore_test';
export const TEST_STORAGE_CONFIG = {
  supabaseUrl: 'https://test.supabase.co',
  bucket: 'product-images',
} as const;

let cachedBundle: DbConnectionBundle | null = null;
let migrationPromise: Promise<void> | null = null;

function resolveSafeTestDbUrl(): string {
  const url = (process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DB_URL).trim();
  const prodUrl = (process.env.DATABASE_URL ?? '').trim();
  const migUrl = (process.env.DATABASE_URL_MIGRATIONS ?? '').trim();

  if (
    !url ||
    url === prodUrl ||
    url === migUrl ||
    url.includes('supabase.co') ||
    url.includes('supabase.com')
  ) {
    throw new Error(
      `Refusing to run integration tests against unsafe or production database URL: "${url}"`,
    );
  }

  return url;
}

export function ensureTestAuthSecret(): void {
  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    process.env.AUTH_SECRET = 'test-auth-secret-at-least-thirty-two-bytes-long-123456';
  }
}

export async function getTestDb(): Promise<DbClient> {
  ensureTestAuthSecret();

  if (!cachedBundle) {
    cachedBundle = createDbConnection(resolveSafeTestDbUrl(), {
      max: 4,
      idleTimeoutSeconds: 10,
    });
  }

  if (!migrationPromise) {
    migrationPromise = migrate(cachedBundle.db, {
      migrationsFolder: path.resolve(process.cwd(), 'drizzle'),
    });
  }

  await migrationPromise;
  return cachedBundle.db;
}

export async function resetAndSeedTestDb(db?: DbClient): Promise<DbClient> {
  const client = db ?? (await getTestDb());
  await client.transaction(async (tx) => {
    await tx.execute(rawSql.raw(TRUNCATE_SAMPLE_TABLES_SQL));
    await seedCatalog(tx, TEST_STORAGE_CONFIG);
  });
  return client;
}

export async function closeTestDb(): Promise<void> {
  if (cachedBundle) {
    await cachedBundle.sql.end({ timeout: 5 });
    cachedBundle = null;
    migrationPromise = null;
  }
}

export function setupTestDbLifecycle(options?: {
  onBeforeAll?: (db: DbClient) => Promise<void> | void;
  onBeforeEach?: (db: DbClient) => Promise<void> | void;
}): () => DbClient {
  let currentDb: DbClient;

  beforeAll(async () => {
    currentDb = await getTestDb();
    await options?.onBeforeAll?.(currentDb);
  });

  beforeEach(async () => {
    await resetAndSeedTestDb(currentDb);
    await options?.onBeforeEach?.(currentDb);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  return () => currentDb;
}
