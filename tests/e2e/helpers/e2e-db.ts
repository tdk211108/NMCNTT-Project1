import { execFileSync } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
import postgres from 'postgres';
import { E2E_DB_URL, E2E_MOCK_RESEND_ORIGIN } from './e2e-constants';
import type { CapturedEmail } from './mock-resend-server';

function assertSafeLocalUrl(url: string): string {
  const trimmed = url.trim();
  const isLocalHost = trimmed.includes('127.0.0.1') || trimmed.includes('localhost');
  if (
    !trimmed ||
    !isLocalHost ||
    trimmed.includes('supabase.co') ||
    trimmed.includes('supabase.com')
  ) {
    throw new Error(`Refusing E2E DB operation against unsafe URL: "${trimmed}"`);
  }
  return trimmed;
}

export function isExternalTarget(): boolean {
  return (process.env.PLAYWRIGHT_BASE_URL ?? '').trim().length > 0;
}

export function resetAndSeedE2eDb(): void {
  if (isExternalTarget()) {
    throw new Error('resetAndSeedE2eDb cannot be called when PLAYWRIGHT_BASE_URL is set.');
  }
  const safeUrl = assertSafeLocalUrl(E2E_DB_URL);
  execFileSync(
    process.execPath,
    ['--conditions=react-server', '--import', 'tsx', 'tests/e2e/helpers/seed-e2e-db.ts'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        E2E_DATABASE_URL: safeUrl,
      },
    },
  );
}

export async function clearAuthFailures(): Promise<void> {
  if (isExternalTarget()) return;
  const sql = postgres(assertSafeLocalUrl(E2E_DB_URL), { max: 1, idle_timeout: 5 });
  try {
    await sql`DELETE FROM auth_failures`;
  } finally {
    await sql.end();
  }
}

export async function clearOrdersAndUsers(): Promise<void> {
  if (isExternalTarget()) return;
  const sql = postgres(assertSafeLocalUrl(E2E_DB_URL), { max: 1, idle_timeout: 5 });
  try {
    await sql`TRUNCATE TABLE order_status_events, order_items, orders, auth_failures, email_otps, oauth_accounts, users RESTART IDENTITY CASCADE`;
  } finally {
    await sql.end();
  }
}

function buildScryptHash(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 32, {
    N: 32_768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt:32768:8:1:${salt.toString('base64url')}:${derived.toString('base64url')}`;
}

export async function seedCustomerAccount(params: {
  username: string;
  email: string;
  displayName: string;
  password: string;
}): Promise<{ id: string; username: string; email: string }> {
  if (isExternalTarget()) {
    throw new Error('seedCustomerAccount cannot be called when PLAYWRIGHT_BASE_URL is set.');
  }
  const sql = postgres(assertSafeLocalUrl(E2E_DB_URL), { max: 1, idle_timeout: 5 });
  const normalizedUsername = params.username.trim().toLowerCase();
  const normalizedEmail = params.email.trim().toLowerCase();
  const hash = buildScryptHash(params.password);

  try {
    const [existing] = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE username = ${normalizedUsername} OR email = ${normalizedEmail} LIMIT 1
    `;
    if (existing) {
      await sql`
        UPDATE users
        SET username = ${normalizedUsername},
            email = ${normalizedEmail},
            display_name = ${params.displayName},
            password_hash = ${hash},
            email_verified_at = COALESCE(email_verified_at, NOW()),
            updated_at = NOW()
        WHERE id = ${existing.id}
      `;
      return { id: existing.id, username: normalizedUsername, email: normalizedEmail };
    }

    const [created] = await sql<{ id: string }[]>`
      INSERT INTO users (username, password_hash, email, email_verified_at, display_name)
      VALUES (${normalizedUsername}, ${hash}, ${normalizedEmail}, NOW(), ${params.displayName})
      RETURNING id
    `;
    return { id: created.id, username: normalizedUsername, email: normalizedEmail };
  } finally {
    await sql.end();
  }
}

export async function clearCapturedEmails(): Promise<void> {
  if (isExternalTarget()) return;
  const response = await fetch(`${E2E_MOCK_RESEND_ORIGIN}/captured`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(`Failed to clear mock Resend emails: ${response.status}`);
  }
}

export async function getCapturedEmails(to?: string): Promise<CapturedEmail[]> {
  if (isExternalTarget()) return [];
  const query = to ? `?to=${encodeURIComponent(to)}` : '';
  const response = await fetch(`${E2E_MOCK_RESEND_ORIGIN}/captured${query}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch mock Resend emails: ${response.status}`);
  }
  const body = (await response.json()) as { emails: CapturedEmail[] };
  return body.emails;
}

export async function waitForCapturedEmail(
  predicate: (email: CapturedEmail) => boolean,
  timeoutMs = 10_000,
): Promise<CapturedEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const emails = await getCapturedEmails();
    const matched = [...emails].reverse().find(predicate);
    if (matched) {
      return matched;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for matching captured email.`);
}

export function extractSixDigitOtp(email: CapturedEmail): string {
  const match = email.text.match(/\b(\d{6})\b/) ?? email.html.match(/\b(\d{6})\b/);
  if (!match?.[1]) {
    throw new Error(`Could not find 6-digit OTP code in email subject "${email.subject}"`);
  }
  return match[1];
}
