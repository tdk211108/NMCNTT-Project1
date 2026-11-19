import * as nextEnv from '@next/env';
import { defineConfig } from 'drizzle-kit';

const loadEnvConfig =
  nextEnv.loadEnvConfig ??
  (nextEnv as unknown as { default?: { loadEnvConfig?: typeof nextEnv.loadEnvConfig } }).default
    ?.loadEnvConfig;

loadEnvConfig?.(process.cwd(), process.env.NODE_ENV !== 'production');

export default defineConfig({
  schema: './src/server/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_MIGRATIONS ?? '',
  },
});
