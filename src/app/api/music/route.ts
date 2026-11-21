import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { listLocalMusicTracks } from '@/server/services/music.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async () => {
  const tracks = await listLocalMusicTracks();
  return jsonWithHeaders({ tracks });
});
