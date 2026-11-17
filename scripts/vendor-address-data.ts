import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DATASET_URL =
  'https://raw.githubusercontent.com/thanglequoc/vietnamese-provinces-database/master/json/vn_only_simplified_json_generated_data_vn_units_minified.json';
const LICENSE_URL =
  'https://raw.githubusercontent.com/thanglequoc/vietnamese-provinces-database/master/LICENSE';

interface RawWard {
  Code: string;
  FullName: string;
}

interface RawProvince {
  Code: string;
  FullName: string;
  Wards?: RawWard[];
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function main() {
  const root = process.cwd();
  const dataDir = path.join(root, 'src', 'data');
  const licenseDir = path.join(root, 'LICENSES');

  const [jsonText, licenseText] = await Promise.all([
    fetchText(DATASET_URL),
    fetchText(LICENSE_URL),
  ]);

  const parsed = JSON.parse(jsonText) as RawProvince[];
  if (!Array.isArray(parsed) || parsed.length !== 34) {
    throw new Error(`Expected 34 provinces, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`);
  }

  let totalWards = 0;
  for (const province of parsed) {
    if (!province.Code || !province.FullName || !Array.isArray(province.Wards)) {
      throw new Error(`Malformed province entry: ${JSON.stringify(province).slice(0, 120)}`);
    }
    totalWards += province.Wards.length;
  }

  if (totalWards < 3000) {
    throw new Error(`Unexpectedly low ward count: ${totalWards}`);
  }

  await mkdir(dataDir, { recursive: true });
  await mkdir(licenseDir, { recursive: true });

  await Promise.all([
    writeFile(path.join(dataDir, 'vn-admin-units.json'), jsonText, 'utf8'),
    writeFile(path.join(licenseDir, 'vietnamese-provinces-database.MIT.txt'), licenseText, 'utf8'),
  ]);

  console.log(`Vendored ${parsed.length} provinces and ${totalWards} wards into src/data/vn-admin-units.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
