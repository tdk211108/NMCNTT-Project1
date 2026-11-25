import { sql as rawSql } from 'drizzle-orm';
import { createDbConnection } from '../src/server/db/client';
import {
  cpuSpecs,
  gpuSeries,
  gpuVariants,
  legacyCpus,
  orders,
  products,
} from '../src/server/db/schema';
import { seedCatalog, TRUNCATE_SAMPLE_TABLES_SQL } from '../src/server/db/seed/seed-catalog';
import { loadProjectEnv } from './lib/load-env';

async function main(): Promise<void> {
  loadProjectEnv();

  const force = process.argv.includes('--force');
  const connectionString = (process.env.DATABASE_URL_MIGRATIONS ?? '').trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL_MIGRATIONS must be set in .env.');
  }

  const { sql, db } = createDbConnection(connectionString, { max: 1, idleTimeoutSeconds: 10 });

  try {
    const result = await db.transaction(async (tx) => {
      const existingOrder = await tx.select({ id: orders.id }).from(orders).limit(1);
      if (existingOrder.length > 0 && !force) {
        throw new Error(
          'Database already contains placed orders. Re-run with -- --force to truncate orders and re-seed.',
        );
      }

      if (force) {
        await tx.execute(rawSql.raw(TRUNCATE_SAMPLE_TABLES_SQL));
      } else {
        await tx.delete(gpuVariants);
        await tx.delete(cpuSpecs);
        await tx.delete(products);
        await tx.delete(gpuSeries);
        await tx.delete(legacyCpus);
      }

      return seedCatalog(tx);
    });

    console.log('Seed completed:', result);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('Database seed failed:', err);
  process.exit(1);
});
