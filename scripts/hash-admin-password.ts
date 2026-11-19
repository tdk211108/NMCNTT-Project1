import { hashAdminPassword } from '../src/server/auth/password';

async function main(): Promise<void> {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run admin:hash -- "<password>"');
    process.exit(1);
  }

  const hash = await hashAdminPassword(password);
  console.log(hash);
}

main().catch((err) => {
  console.error('Failed to hash admin password:', err);
  process.exit(1);
});
