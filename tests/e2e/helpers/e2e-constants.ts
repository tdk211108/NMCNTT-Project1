export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export const E2E_MOCK_RESEND_PORT = 3199;
export const E2E_MOCK_RESEND_ORIGIN = `http://127.0.0.1:${E2E_MOCK_RESEND_PORT}`;
export const E2E_MOCK_RESEND_EMAILS_URL = `${E2E_MOCK_RESEND_ORIGIN}/emails`;

export const E2E_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:5433/techcore_test';

export const E2E_AUTH_SECRET = 'coreraster-e2e-local-auth-secret-minimum-32-bytes-01';
export const E2E_CRON_SECRET = 'coreraster-e2e-local-cron-secret-01';
export const E2E_ADMIN_PASSWORD = 'E2eAdminPass!2026';
export const E2E_ADMIN_PASSWORD_HASH =
  'scrypt:32768:8:1:Y29yZXJhc3Rlci1lMmUtc2FsdA:g0qrf9_jGm3PRFYN3lOPwCH4CJ6WKWnzXXYDepmWJOc';

export const E2E_SUPABASE_URL = 'https://test.supabase.co';
export const E2E_SUPABASE_BUCKET = 'product-images';

export const E2E_SEED_IDS = {
  cpuRyzen9800x3d: 'cpu-amd-ryzen-7-9800x3d',
  cpuRyzen7500f: 'cpu-amd-ryzen-5-7500f',
  cpuCoreUltra9: 'cpu-intel-core-ultra-9-285k',
  cpuCoreI514600k: 'cpu-intel-core-i5-14600k',
  gpuAstral5090: 'gpu-asus-rog-astral-rtx-5090-32gb-oc',
  gpuTuf5090: 'gpu-asus-tuf-rtx-5090-32gb-oc',
  gpuLimited5090: 'gpu-asus-rog-astral-rtx-5090-edition-20',
  legacyCpuI9: 'C01',
  legacyCpuI5: 'C07',
  legacyGpu4090: 'G01',
  legacyGpu4060: 'G07',
  retailGpuSeries5090: 'gs-rtx-5090',
} as const;
