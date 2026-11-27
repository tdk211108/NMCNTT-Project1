import { defineConfig } from '@playwright/test';
import {
  E2E_ADMIN_PASSWORD_HASH,
  E2E_AUTH_SECRET,
  E2E_BASE_URL,
  E2E_CRON_SECRET,
  E2E_DB_URL,
  E2E_MOCK_RESEND_EMAILS_URL,
  E2E_MOCK_RESEND_ORIGIN,
  E2E_SUPABASE_BUCKET,
  E2E_SUPABASE_URL,
} from './tests/e2e/helpers/e2e-constants';

const externalBaseUrl = (process.env.PLAYWRIGHT_BASE_URL ?? '').trim();
const isExternal = externalBaseUrl.length > 0;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: isExternal ? undefined : './tests/e2e/global-setup.ts',
  use: {
    baseURL: isExternal ? externalBaseUrl : E2E_BASE_URL,
    channel: 'msedge',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  projects: [
    {
      name: 'desktop',
      testMatch: /desktop\/.*\.spec\.ts/,
      use: {
        channel: 'msedge',
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile-360',
      testMatch: /mobile\/.*\.spec\.ts/,
      use: {
        channel: 'msedge',
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: isExternal
    ? undefined
    : [
        {
          command: 'npx tsx tests/e2e/helpers/mock-resend-server.ts',
          url: `${E2E_MOCK_RESEND_ORIGIN}/health`,
          reuseExistingServer: false,
          timeout: 30_000,
        },
        {
          command: 'npx next start -H 127.0.0.1 -p 3100',
          url: `${E2E_BASE_URL}/api/health`,
          reuseExistingServer: false,
          timeout: 60_000,
          env: {
            ...process.env,
            NODE_ENV: 'production',
            DATABASE_URL: E2E_DB_URL,
            DATABASE_URL_MIGRATIONS: E2E_DB_URL,
            AUTH_SECRET: E2E_AUTH_SECRET,
            ADMIN_PASSWORD: E2E_ADMIN_PASSWORD_HASH,
            CRON_SECRET: E2E_CRON_SECRET,
            RESEND_API_KEY: 're_e2e_local_mock_key',
            RESEND_API_URL: E2E_MOCK_RESEND_EMAILS_URL,
            EMAIL_FROM: 'CoreRaster <no-reply@coreraster.me>',
            SUPABASE_URL: E2E_SUPABASE_URL,
            SUPABASE_SECRET_KEY: '',
            SUPABASE_STORAGE_BUCKET: E2E_SUPABASE_BUCKET,
            STORE_NAME: 'CoreRaster',
            NEXT_PUBLIC_SITE_URL: E2E_BASE_URL,
          },
        },
      ],
});
