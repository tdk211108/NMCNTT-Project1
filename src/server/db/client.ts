import 'server-only';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';
import * as schema from './schema';

export type DbClient = PostgresJsDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | DbTransaction;

export interface DbConnectionBundle {
  sql: Sql;
  db: DbClient;
}

const globalForDb = globalThis as typeof globalThis & {
  __techcoreSql?: Sql;
  __techcoreDb?: DbClient;
};

/**
 * Creates a Drizzle + postgres.js client bundle.
 * `prepare: false` and `max_pipeline: 1` prevent Supavisor transaction pooler (`:6543`)
 * stalls caused by pipelined extended queries blocking in `ClientRead`.
 */
export function createDbConnection(
  connectionString: string,
  options?: { max?: number; idleTimeoutSeconds?: number },
): DbConnectionBundle {
  const sql = postgres(connectionString, {
    prepare: false,
    max: options?.max ?? 5,
    idle_timeout: options?.idleTimeoutSeconds ?? 20,
    connect_timeout: 10,
    query_timeout: 15,
    queue_timeout: 10,
    max_pipeline: 1,
  });
  const db = drizzle(sql, { schema });
  return { sql, db };
}

/**
 * Returns the lazily initialized runtime Drizzle instance backed by `DATABASE_URL`.
 */
export function getDb(): DbClient {
  if (globalForDb.__techcoreDb) {
    return globalForDb.__techcoreDb;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is missing.');
  }

  const { sql, db } = createDbConnection(connectionString, {
    max: 5,
    idleTimeoutSeconds: 20,
  });

  globalForDb.__techcoreSql = sql;
  globalForDb.__techcoreDb = db;
  return db;
}

export function getSql(): Sql {
  if (!globalForDb.__techcoreSql) {
    getDb();
  }
  return globalForDb.__techcoreSql!;
}
