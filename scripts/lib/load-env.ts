import * as nextEnv from '@next/env';

const loadEnvConfig =
  nextEnv.loadEnvConfig ??
  (nextEnv as unknown as { default?: { loadEnvConfig?: typeof nextEnv.loadEnvConfig } }).default
    ?.loadEnvConfig;

/**
 * Loads `.env` and `.env.local` using Next.js env rules so standalone CLI
 * scripts behave identically to the Next.js server runtime.
 */
export function loadProjectEnv(): void {
  loadEnvConfig?.(process.cwd(), process.env.NODE_ENV !== 'production');
}
