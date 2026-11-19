import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ERROR_MESSAGES } from '@/server/http/errors';
import { VI_MESSAGES } from '@/shared/messages/vi';

const EM_DASH_RE = /—/;
const BULLET_LINE_RE = /^\s*(?:[•◦]|[-*]\s+)/m;

function collectStrings(value: unknown, trail = 'VI_MESSAGES'): Array<{ path: string; text: string }> {
  if (typeof value === 'string') {
    return [{ path: trail, text: value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStrings(item, `${trail}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      collectStrings(child, `${trail}.${key}`),
    );
  }
  return [];
}

function listPolicyFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listPolicyFiles(full);
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') ? [full] : [];
  });
}

describe('Vietnamese copy and formatting guardrails', () => {
  it('VI_MESSAGES and ERROR_MESSAGES contain no em-dashes or bullet markers', () => {
    const entries = [
      ...collectStrings(VI_MESSAGES, 'VI_MESSAGES'),
      ...collectStrings(ERROR_MESSAGES, 'ERROR_MESSAGES'),
    ];
    expect(entries.length).toBeGreaterThan(0);

    for (const entry of entries) {
      expect(entry.text, `${entry.path} contains em-dash`).not.toMatch(EM_DASH_RE);
      expect(entry.text, `${entry.path} contains bullet marker`).not.toMatch(BULLET_LINE_RE);
    }
  });

  it('policy pages and app error views contain no em-dashes or bullet markers', () => {
    const policyDir = path.resolve(process.cwd(), 'src', 'app', 'policies');
    const errorFiles = ['not-found.tsx', 'error.tsx']
      .map((name) => path.resolve(process.cwd(), 'src', 'app', name))
      .filter((filePath) => existsSync(filePath));
    const files = [...listPolicyFiles(policyDir), ...errorFiles];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      expect(content, `${file} contains em-dash`).not.toMatch(EM_DASH_RE);
      expect(content, `${file} contains bullet marker`).not.toMatch(BULLET_LINE_RE);
    }
  });
});
