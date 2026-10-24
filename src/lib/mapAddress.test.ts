// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { MAP_PATH, MOVED_MAP_SCRIPT, movedMapRedirect } from '@/lib/mapAddress';

const SITE = 'https://scootradar.com';

describe('links to the map as it was at the root', () => {
  it.each([
    ['/?origin=47.3769,8.5417', '/map?origin=47.3769,8.5417'],
    ['/?minBattery=45&theme=dark', '/map?minBattery=45&theme=dark'],
    ['/?map=detailed', '/map?map=detailed'],
    ['/?tile=osm&utm_source=share', '/map?tile=osm&utm_source=share'],
  ])('sends %s on to the map with all it carries', (from, to) => {
    const response = movedMapRedirect(new Request(`${SITE}${from}`));

    expect(response?.status).toBe(308);
    expect(response?.headers.get('location')).toBe(`${SITE}${to}`);
  });

  it.each(['/', '/?utm_source=share', '/de?origin=47.3769,8.5417', '/map?origin=47.3769,8.5417', '/privacy?theme=dark'])(
    'leaves %s where it is',
    (path) => {
      expect(movedMapRedirect(new Request(`${SITE}${path}`))).toBeNull();
    },
  );

  it('answers only what asks for a page', () => {
    expect(movedMapRedirect(new Request(`${SITE}/?theme=dark`, { method: 'POST' }))).toBeNull();
    expect(movedMapRedirect(new Request(`${SITE}/?theme=dark`, { method: 'HEAD' }))?.status).toBe(308);
  });
});

describe('the landing page, opened where the map was', () => {
  function opened(address: string, { installed = false, standalone = false } = {}) {
    const url = new URL(address, SITE);
    const replace = vi.fn();
    runInNewContext(MOVED_MAP_SCRIPT, {
      URLSearchParams,
      location: { pathname: url.pathname, search: url.search, hash: url.hash, replace },
      navigator: { standalone },
      matchMedia: (query: string) => ({ matches: installed && query === '(display-mode: standalone)' }),
    });
    return replace;
  }

  it('stays for a visitor', () => {
    expect(opened('/')).not.toHaveBeenCalled();
    expect(opened('/?utm_source=share#cities')).not.toHaveBeenCalled();
  });

  it('gives way to the map for a link that only the map reads', () => {
    expect(opened('/?origin=47.3769,8.5417#x')).toHaveBeenCalledWith(`${MAP_PATH}?origin=47.3769,8.5417#x`);
    expect(opened('/?tile=dark')).toHaveBeenCalledWith(`${MAP_PATH}?tile=dark`);
  });

  it('gives way to the map in an app installed from the root, on Android and on iOS', () => {
    expect(opened('/', { installed: true })).toHaveBeenCalledWith(MAP_PATH);
    expect(opened('/', { standalone: true })).toHaveBeenCalledWith(MAP_PATH);
  });

  it('gives way to the map in an app installed from the root that the Worker sent on to its language', () => {
    expect(opened('/de', { installed: true })).toHaveBeenCalledWith(MAP_PATH);
    expect(opened('/fr#x', { standalone: true })).toHaveBeenCalledWith(`${MAP_PATH}#x`);
  });

  it('stays in its other languages for a link the map reads, which never was the map there', () => {
    expect(opened('/fr?theme=dark')).not.toHaveBeenCalled();
  });

  it('stays on any other page of the site, in an installed app too', () => {
    expect(opened('/guides', { installed: true })).not.toHaveBeenCalled();
    expect(opened('/de/ratgeber', { standalone: true })).not.toHaveBeenCalled();
  });

  it('does not stop the page where the browser tells it nothing', () => {
    expect(() => runInNewContext(MOVED_MAP_SCRIPT, {})).not.toThrow();
  });
});
