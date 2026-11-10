import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./check-scrapers.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', script, ...args],
  { encoding: 'utf8', timeout: 10_000 });

// Both answer before reading Prometheus or Cloudflare.
describe('the scraping check', () => {
  it('prints its usage on --help', () => {
    const { status, stdout } = run('--help');
    expect(status).toBe(0);
    expect(stdout).toMatch(/^Usage: node scripts\/check-scrapers\.mjs \[--date=YYYY-MM-DD\]/);
  });

  it('refuses an option it does not know, rather than checking another day', () => {
    for (const option of ['--date=yesterday', '--nope', 'json']) {
      const { status, stderr } = run(option);
      expect(status, option).toBe(2);
      expect(stderr, option).toContain(`Unknown option ${option}\nUsage:`);
    }
  });
});

// `ssh netcup … wget '<Prometheus URL>'` is answered by a stand-in on PATH, from the sweeps counter as Prometheus
// holds it: scraped every 30 s, 10 s past each half minute, and counting a quarter hour once it has closed, so its
// step lands at the first scrape after the quarter hour. Its increase is the last sample less the first in the
// window, without Prometheus's extrapolation. Cloudflare and scootradar.com are not asked: fetch fails.
describe('the scraping check on a day with sweeps', () => {
  const day = Date.parse('2026-11-05T00:00:00Z') / 1000;
  // A sweep in 14:00-14:15 UTC, counted at 14:15:10, and one in 23:45-24:00, counted at 00:00:10 the next day.
  const sweepsCounted = [day + 14 * 3600 + 15 * 60 + 10, day + 86_400 + 10];
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'check-scrapers-'));
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin', 'ssh'), `#!${process.execPath}
const url = new URL(/'(http:\\/\\/localhost:9090[^']*)'/.exec(process.argv.at(-1))[1]);
const params = url.searchParams, query = params.get('query');
const counted = ${JSON.stringify(sweepsCounted)};
const samples = at => { const from = ${day - 3600 + 10}; return at < from ? [] : [from + 30 * Math.floor((at - from) / 30)]; };
const count = at => counted.filter(close => close <= at).length;
function increase(at) {
  const [, amount, unit] = /\\[(\\d+)([mh])\\]/.exec(query);
  const window = Number(amount) * (unit === 'h' ? 3600 : 60);
  const last = samples(at)[0];
  const first = samples(at - window)[0] + 30;
  return count(last) - count(first);
}
// The sweeps alone; the other counters hold nothing.
const sweeps = query.includes('areas=~"32-63');
const result = !sweeps ? [] : url.pathname === '/api/v1/query'
  ? [{ metric: {}, value: [Number(params.get('time')), String(increase(Number(params.get('time'))))] }]
  : [{ metric: {}, values: Array.from({ length: (Number(params.get('end')) - Number(params.get('start'))) / Number(params.get('step')) + 1 },
    (_, i) => Number(params.get('start')) + i * Number(params.get('step'))).map(at => [at, String(increase(at))]) }];
process.stdout.write(JSON.stringify({ status: 'success', data: { resultType: 'vector', result } }));
`);
    chmodSync(join(dir, 'bin', 'ssh'), 0o755);
    writeFileSync(join(dir, 'no-internet.mjs'), "globalThis.fetch = async () => { throw new Error('not asked'); };\n");
  });
  afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

  const check = date => {
    const { stdout } = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--import', join(dir, 'no-internet.mjs'),
      script, `--date=${date}`, '--json'], { encoding: 'utf8', timeout: 20_000,
      env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, CLOUDFLARE_API_TOKEN: 'none' } });
    return JSON.parse(stdout);
  };

  it('names the quarter hour of each sweep, for Cloudflare\'s clients to be matched by the hour', () => {
    const report = check('2026-11-05');
    expect(report.failures).toEqual(['not asked']);
    expect(report.metrics.sweptAt).toEqual(['14:00', '23:45']);
    expect(report.suspicions[0]).toBe('2 visitor(s) asked for 32 areas or more in a quarter hour (UTC 14:00, 23:45)');
  });

  it('counts a sweep in the day\'s last quarter hour on that day, not the next', () => {
    expect(check('2026-11-05').metrics.sweeps).toBe(2);
    expect(check('2026-11-06').metrics).toMatchObject({ sweeps: 0, sweptAt: [] });
  });
});
