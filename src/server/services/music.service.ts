import 'server-only';

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { MUSIC_ALLOWED_EXTENSIONS } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { MusicTrack } from '@/shared/types';

const naturalCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
const EXTENSION_SET = new Set<string>(MUSIC_ALLOWED_EXTENSIONS);

// Static deploy-time track list avoids tracing 56+ MB of public/music audio into /api/music lambda.
export const BUNDLED_MUSIC_FILES = [
  'Dawid Podsiadło - Let You Down.m4a',
  'HOYO-MiX - Fountain of Belleau.m4a',
  'Kevin Penkin - Old Stories.m4a',
  'Konomi Suzuki - This Game.m4a',
  'Linked Horizon - Akatsuki no Requiem.m4a',
  'MUSIC4VIDEO - FUTURE.m4a',
  'P.T. Adamczyk - The Rebel Path.m4a',
  'Sandfall Interactive - Alicia.m4a',
  'YUI - Again.m4a',
] as const;

export function parseMusicTrackFilename(fileName: string): MusicTrack {
  const ext = path.extname(fileName);
  const stem = ext ? fileName.slice(0, -ext.length) : fileName;
  const normalized = stem.replace(/_/g, ' ').trim();
  const separatorIndex = normalized.indexOf(' - ');

  const hasArtist = separatorIndex > 0 && separatorIndex < normalized.length - 3;
  const artist = hasArtist
    ? normalized.slice(0, separatorIndex).trim()
    : VI_MESSAGES.nav.musicDefaultArtist;
  const title = hasArtist ? normalized.slice(separatorIndex + 3).trim() : normalized || fileName;

  return {
    id: fileName,
    title,
    artist,
    fileName,
    src: `/music/${encodeURIComponent(fileName)}`,
  };
}

export async function listLocalMusicTracks(musicDir?: string): Promise<MusicTrack[]> {
  if (!musicDir) {
    return [...BUNDLED_MUSIC_FILES]
      .sort((a, b) => naturalCollator.compare(a, b))
      .map(parseMusicTrackFilename);
  }

  try {
    const entries = await readdir(/*turbopackIgnore: true*/ musicDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && EXTENSION_SET.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => entry.name)
      .sort((a, b) => naturalCollator.compare(a, b))
      .map(parseMusicTrackFilename);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
