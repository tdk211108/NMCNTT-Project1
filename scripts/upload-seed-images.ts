import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { SEED_IMAGE_PREFIX } from '../src/shared/constants';
import { loadProjectEnv } from './lib/load-env';

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const CONCURRENCY = 8;

async function main(): Promise<void> {
  loadProjectEnv();

  const supabaseUrl = (process.env.SUPABASE_URL ?? '').trim();
  const secretKey = (process.env.SUPABASE_SECRET_KEY ?? '').trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images').trim();

  if (!supabaseUrl || !secretKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.');
  }

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const seedDir = path.join(process.cwd(), 'seed-images');
  const entries = (await readdir(seedDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort();

  if (entries.length === 0) {
    throw new Error('No files found inside seed-images/.');
  }

  let uploaded = 0;

  for (let i = 0; i < entries.length; i += CONCURRENCY) {
    const batch = entries.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (fileName) => {
        const ext = path.extname(fileName).toLowerCase();
        const contentType = CONTENT_TYPES[ext];
        if (!contentType) {
          throw new Error(`Unsupported image extension for ${fileName}`);
        }

        const fileBuffer = await readFile(path.join(seedDir, fileName));
        const objectPath = `${SEED_IMAGE_PREFIX}${fileName}`;
        const { error } = await supabase.storage.from(bucket).upload(objectPath, fileBuffer, {
          contentType,
          cacheControl: '31536000',
          upsert: true,
        });

        if (error) {
          throw new Error(`Failed to upload ${objectPath}: ${error.message}`);
        }
        uploaded += 1;
      }),
    );
  }

  console.log(`Uploaded ${uploaded} seed images to bucket "${bucket}" under "${SEED_IMAGE_PREFIX}".`);
}

main().catch((err) => {
  console.error('Seed image upload failed:', err);
  process.exit(1);
});
