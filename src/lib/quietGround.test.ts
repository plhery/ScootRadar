import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GROUND_PALETTES, forgetGroundTileUrl, groundRules, groundTileUrl } from '@/lib/quietGround';

const TILES = 'https://tiles.openfreemap.org/planet/20261007_001001_pt/{z}/{x}/{y}.pbf';
const answer = (body: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => body }) as Response);

beforeEach(() => {
  forgetGroundTileUrl();
});

describe('groundTileUrl', () => {
  it('asks once per visit where the tiles are', async () => {
    const fetcher = answer({ tiles: [TILES] });

    expect(await groundTileUrl(fetcher)).toBe(TILES);
    expect(await groundTileUrl(fetcher)).toBe(TILES);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('https://tiles.openfreemap.org/planet');
  });

  it('does not remember a failure, so that the next try asks again', async () => {
    await expect(groundTileUrl(answer({}, false))).rejects.toThrow('Map tiles: 503');
    await expect(groundTileUrl(vi.fn(async () => { throw new TypeError('offline'); }))).rejects.toThrow('offline');

    expect(await groundTileUrl(answer({ tiles: [TILES] }))).toBe(TILES);
  });

  it.each([
    ['no address at all', {}],
    ['an address on another host', { tiles: ['https://example.com/{z}/{x}/{y}.pbf'] }],
    ['an address that is not a tile pattern', { tiles: ['https://tiles.openfreemap.org/planet'] }],
    ['an address with a query', { tiles: [`${TILES}?key=1`] }],
    ['something that is not text', { tiles: [42] }],
  ])('refuses %s', async (_name, body) => {
    await expect(groundTileUrl(answer(body))).rejects.toThrow('Map tiles: unexpected address');
  });
});

describe('groundRules', () => {
  it('draws the land in the colour of the page, by day and by night', () => {
    expect(GROUND_PALETTES.day.land).toBe('#eef0f4');
    expect(GROUND_PALETTES.night.land).toBe('#0b0e14');
  });

  it('writes more names on the detailed map than on the calm one', () => {
    const calm = groundRules('night', 'calm', 'Red Hat Text');
    const detailed = groundRules('night', 'detailed', 'Red Hat Text');
    expect(detailed.labels.length).toBeGreaterThan(calm.labels.length);
    // What is drawn under the names is the same.
    expect(detailed.paint.length).toBeGreaterThanOrEqual(calm.paint.length);
  });
});
