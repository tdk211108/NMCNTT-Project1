import { clearCapturedEmails, isExternalTarget, resetAndSeedE2eDb } from './helpers/e2e-db';

export default async function globalSetup(): Promise<void> {
  if (isExternalTarget()) {
    return;
  }
  resetAndSeedE2eDb();
  await clearCapturedEmails().catch(() => {
    // Mock Resend starts empty; ignore if server closes early.
  });
}
