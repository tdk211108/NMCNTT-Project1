import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCachedMusicTracks, resetMusicTracksCache } from '@/lib/music-cache';
import { computeWeightedProgress, preloadEssentialAssets } from '@/lib/preloader';
import { VI_MESSAGES } from '@/shared/messages/vi';

vi.mock('next/navigation', () => ({
  usePathname: () => '/cpu',
}));

const { SitePreloader } = await import('@/features/layout/SitePreloader');

describe('SitePreloader and essential media preloading', () => {
  afterEach(() => {
    resetMusicTracksCache();
    vi.unstubAllGlobals();
  });

  it('computes bounded weighted progress cleanly across asset stages', () => {
    expect(
      computeWeightedProgress({ core: 0, data: 0, video: 0, audio: 0 }),
    ).toBe(0);
    expect(
      computeWeightedProgress({ core: 1, data: 1, video: 0, audio: 0 }),
    ).toBeCloseTo(0.35, 5);
    expect(
      computeWeightedProgress({ core: 1, data: 1, video: 1, audio: 1 }),
    ).toBe(1);
    expect(
      computeWeightedProgress({ core: 3, data: -2, video: Number.NaN, audio: 1 }),
    ).toBeCloseTo(0.4, 5);
  });

  it('deduplicates /api/music requests across Preloader and MusicPlayerBar and recovers after errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tracks: [{ fileName: 'track.m4a', title: 'Track 1', artist: 'OST', src: '/music/track.m4a' }],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    // Failed response should return empty list without poisoning cache.
    const firstAttempt = await fetchCachedMusicTracks();
    expect(firstAttempt).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Next attempt succeeds cleanly and subsequent callers reuse the cached promise/value.
    const [secondAttempt, thirdAttempt] = await Promise.all([
      fetchCachedMusicTracks(),
      fetchCachedMusicTracks(),
    ]);
    expect(secondAttempt).toHaveLength(1);
    expect(thirdAttempt).toEqual(secondAttempt);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const cachedFollowUp = await fetchCachedMusicTracks();
    expect(cachedFollowUp).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('guarantees monotonic progress and exits safely when failsafe timeout fires', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    const updates: number[] = [];

    await preloadEssentialAssets({
      pathname: '/cpu',
      prefersReducedMotion: true,
      timeoutMs: 35,
      onUpdate: (update) => {
        updates.push(update.progress);
      },
    });

    expect(updates.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < updates.length; i += 1) {
      expect(updates[i]!).toBeGreaterThanOrEqual(updates[i - 1]!);
    }
    expect(updates[updates.length - 1]).toBe(1);
  });

  it('renders SSR Crimson Pyramid markup with semantic <progress>, percentage readout, and <noscript> guard without lists', () => {
    const html = renderToStaticMarkup(createElement(SitePreloader));
    expect(html).toContain('data-testid="site-preloader"');
    expect(html).toContain('data-closing="false"');
    expect(html).toContain('mtx-pyramid-loader');
    expect(html).toContain('mtx-pyramid-wrapper');
    expect(html).toContain('mtx-pyramid-side-1');
    expect(html).toContain('mtx-pyramid-side-4');
    expect(html).toContain('mtx-pyramid-shadow');
    expect(html).toContain('data-testid="site-preloader-progress"');
    expect(html).toContain('<progress');
    expect(html).toContain('max="100"');
    expect(html).toContain('data-testid="site-preloader-percent"');
    expect(html).toContain('0%');
    expect(html).toContain(VI_MESSAGES.preloader.tag);
    expect(html).toContain('<noscript>');
    expect(html).not.toContain('<ul');
    expect(html).not.toContain('<ol');

    // Progress indicator sits after pyramid, and % sits after <progress>.
    expect(html.indexOf('mtx-pyramid-loader')).toBeLessThan(
      html.indexOf('data-testid="site-preloader-progress"'),
    );
    expect(html.indexOf('data-testid="site-preloader-progress"')).toBeLessThan(
      html.indexOf('data-testid="site-preloader-percent"'),
    );
  });
});
