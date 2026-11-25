import { defineConfig } from 'drizzle-kit';
import { loadProjectEnv } from './scripts/lib/load-env';

loadProjectEnv();

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATIONS ?? '',
  },
});
