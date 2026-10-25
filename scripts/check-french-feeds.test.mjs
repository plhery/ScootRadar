import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./check-french-feeds.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 10_000 });
// The check with the scooter cache's /feeds answered from FEEDS, and any other request refused.
const STUB = `data:text/javascript,globalThis.fetch = async url => {
  if (String(url) === 'https://scooter-data.plhery.com/feeds') return new Response(process.env.FEEDS);
  throw new Error('No request outside the stub');
};`;
const runWithFeeds = (feeds, ...args) => spawnSync(process.execPath, ['--import', STUB, script, ...args],
  { encoding: 'utf8', timeout: 10_000, env: { ...process.env, FEEDS: JSON.stringify({ updatedAt: Date.now(), feeds }) } });

// Both answer before the first request, so neither reads a feed.
describe('the live catalog check', () => {
  it('prints its usage on --help', () => {
    const { status, stdout } = run('--help');
    expect(status).toBe(0);
    expect(stdout).toMatch(/^Usage: node scripts\/check-french-feeds\.mjs .*--fail-on=any\|gone/);
    expect(stdout).toContain('north-america');
    expect(stdout).toContain('--apps=cache reads the app maps');
  });

  it('refuses an option it does not know, instead of running the whole check without it', () => {
    for (const option of ['--nope', 'json', '--country=FR']) {
      const { status, stderr } = run('--countries=FR', option);
      expect(status, option).toBe(2);
      expect(stderr, option).toContain(`Unknown option ${option}\nUsage:`);
    }
  });

  it('reads Japan\'s app maps from the scooter cache, a Lime market from its groups', () => {
    const now = Date.now();
    const luup = JSON.parse(readFileSync(new URL('../data/japanese-scooter-feeds.json', import.meta.url), 'utf8'))
      .systems.filter(system => system.luupAppCities).map(system => system.id);
    const states = { luup_jp_osaka: 'failing', luup_jp_kyoto: 'skipped' };
    const feeds = luup.filter(id => id !== 'luup_jp_nagoya').map(id => ({
      id: `japan:${id}`, state: states[id] ?? 'ok', vehicles: states[id] ? 0 : 2, observedAt: now - 60_000,
      ...(id === 'luup_jp_sendai' && { seasonOver: true }),
    })).concat(
      { id: 'japan:lime_jp_app_naha_000', state: 'ok', vehicles: 3, observedAt: now - 300_000 },
      { id: 'japan:lime_jp_app_naha_001', state: 'ok', vehicles: 4, observedAt: now - 60_000 },
      { id: 'japan:lime_jp_app_naha_old', state: 'failing', vehicles: 0, observedAt: null },
    );
    const { status, stdout } = runWithFeeds(feeds, '--countries=JP', '--fail-on=gone', '--apps=cache', '--json');
    expect(status).toBe(0);
    const systems = Object.fromEntries(JSON.parse(stdout).systems.map(result => [result.system, result]));
    expect(systems.luup_jp_shibuya).toMatchObject({ state: 'ok', availableScooters: 2, version: 'app-map (cache)' });
    expect(systems.luup_jp_osaka).toMatchObject({ state: 'failed', error: 'The scooter cache\'s collection is failing' });
    expect(systems.luup_jp_kyoto).toMatchObject({ state: 'paused', error: 'Closed by the operator for now' });
    expect(systems.luup_jp_sendai).toMatchObject({ state: 'paused', error: 'Season over, says the operator' });
    expect(systems.luup_jp_nagoya).toMatchObject({ state: 'failed', error: 'Not among the scooter cache\'s feeds' });
    expect(systems.lime_jp_app_naha).toMatchObject({ state: 'ok', availableScooters: 7 });
    expect(systems.lime_jp_app_naha.ageSeconds).toBeGreaterThanOrEqual(300);
  });

  it('refuses an --apps= mode it does not know', () => {
    const { status, stderr } = run('--countries=DE', '--apps=nope');
    expect(status).toBe(2);
    expect(stderr).toContain('Use --apps=collect or --apps=cache\nUsage:');
  });
});
