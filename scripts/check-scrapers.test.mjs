import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
// window, without Prometheus's extrapolation. Cloudflare and scootradar.com are not asked: fetch fails. Each of the
// check's dozen Prometheus reads starts a Node process, a second or more on a busy machine.
describe('the scraping check on a day with sweeps', { timeout: 60_000 }, () => {
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
  const [, amount, unit] = /\\[(\\d+)([smh])\\]/.exec(query);
  const window = Number(amount) * { s: 1, m: 60, h: 3600 }[unit];
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

  const check = (date, fixture = 'no-internet.mjs') => {
    const { stdout } = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--import', join(dir, fixture),
      script, `--date=${date}`, '--json'], { encoding: 'utf8', timeout: 20_000,
      env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, CLOUDFLARE_API_TOKEN: 'none' } });
    return JSON.parse(stdout);
  };

  it('checks script traffic below the ten busiest networks', () => {
    const top = Array.from({ length: 11 }, (_, i) => ({ count: i < 10 ? 200 : 120,
      dimensions: { clientIP: '192.0.2.' + (i + 1), clientCountryName: 'CH', userAgent: i < 10 ? 'Mozilla/5.0 browser' : 'script' } }));
    writeFileSync(join(dir, 'traffic.mjs'), 'globalThis.fetch = async () => Response.json(' +
      JSON.stringify({ data: { viewer: { zones: [{ top, limited: [], refused: [], required: [], passes: [], total: [] }] } } }) + ')');
    const report = check('2026-11-06', 'traffic.mjs');
    expect(report.traffic.busiest).toHaveLength(10);
    expect(report.suspicions.join(' ')).toContain('120 requests with a script');
  });

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

  it('reads today over the day so far, not the 24 hours before', () => {
    writeFileSync(join(dir, 'six-am.mjs'), "globalThis.fetch = async () => { throw new Error('not asked'); };\n" +
      "const at = Date.parse('2026-11-06T06:00:00Z');\nDate.now = () => at;\n");
    // At 06:00 on the 6th, the day before's two sweeps are its own, the one counted at 00:00:10 too.
    expect(check('2026-11-06', 'six-am.mjs').metrics).toMatchObject({ sweeps: 0, sweptAt: [] });
  });
});

// A day with a client polling all day under a browser's user agent, which neither the day's total nor the user agent
// gives away, and a visitor without a map pass kept collected 32 quarter hours or more: Prometheus over ssh and
// Cloudflare's GraphQL are answered by stand-ins. Addresses are documentation ones.
describe('the scraping check on a day with steady pollers', { timeout: 60_000 }, () => {
  let dir;
  const asked = () => JSON.parse(readFileSync(join(dir, 'asked.json'), 'utf8'));

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'check-scrapers-'));
    mkdirSync(join(dir, 'bin'));
    writeFileSync(join(dir, 'bin', 'ssh'), `#!${process.execPath}
const url = new URL(/'(http:\\/\\/localhost:9090[^']*)'/.exec(process.argv.at(-1))[1]);
const query = url.searchParams.get('query'), at = Number(url.searchParams.get('time'));
const series = (label, values) => Object.entries(values).map(([key, value]) => ({ metric: { [label]: key }, value: [at, String(value)] }));
const result = query.includes('by (client)') ? series('client', { verified: 900, map: 4000, app: 300, other: 450 })
  : query.includes('client="unverified"') ? series('quarter_hours', { '32+': 1, 1: 80, '4-8': 12 })
  : query.includes('past_allowance') ? [{ metric: {}, value: [at, '640'] }]
  : query.includes('pass_required') ? [{ metric: {}, value: [at, '260'] }]
  : query.includes('by (reason)') ? series('reason', { allowance: 120, unbroken: 30, daily: 400, hourly: 0 })
  : query.includes('by (agent, referrer)') ? [['app', 'none', 300], ['browser', 'none', 20], ['browser', 'own', 4900], ['browser', 'other', 450]]
    .map(([agent, referrer, value]) => ({ metric: { agent, referrer }, value: [at, String(value)] })) : [];
process.stdout.write(JSON.stringify({ status: 'success', data: { resultType: 'vector', result } }));
`);
    chmodSync(join(dir, 'bin', 'ssh'), 0o755);
    writeFileSync(join(dir, 'cloudflare.mjs'), `import { writeFileSync } from 'node:fs';
const browser = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const quarter = index => '2026-11-18T' + String(Math.floor(index / 4)).padStart(2, '0') + ':' + String(index % 4 * 15).padStart(2, '0') + ':00Z';
const quarters = (ip, from, length, count) => Array.from({ length }, (_, i) => ({ count, avg: { sampleInterval: 1 },
  dimensions: { clientIP: ip, datetimeFifteenMinutes: quarter(from + i) } }));
// A poller busy all day; the two addresses of one /64, each a part of the day; a map open in the morning; this machine.
const days = [...quarters('198.51.100.7', 30, 34, 30), ...quarters('2001:db8:1:2::5', 0, 13, 12), ...quarters('2001:db8:1:2::6', 40, 13, 12),
  ...quarters('198.51.100.8', 32, 3, 100)];
const top = [['198.51.100.7', 1020], ['2001:db8:1:2::5', 156], ['2001:db8:1:2::6', 156], ['198.51.100.8', 300], ['203.0.113.9', 5000],
  ['192.0.2.50', 200]].map(([ip, count]) => ({ count, dimensions: { clientIP: ip, clientCountryName: 'DE', userAgent: browser } }));
// Asks for a map pass: browsers', of which Turnstile refused 6 and could not check 1, an app's, and this machine's.
const passes = [['198.51.100.20', browser, 204, 40], ['198.51.100.21', browser, 403, 6], ['198.51.100.22', browser, 503, 1],
  ['198.51.100.23', 'okhttp/5.5.1', 403, 2], ['203.0.113.9', browser, 403, 9]]
  .map(([ip, userAgent, status, count]) => ({ count, dimensions: { clientIP: ip, userAgent, edgeResponseStatus: status } }));
// Refused by the Worker: a script under a bare browser's user agent, one that gave up, and this machine. Asked for a
// pass first: a script naming a view.
const refused = [['198.51.100.30', 'Mozilla/5.0', 150], ['198.51.100.31', 'Python-urllib/3.14', 3], ['203.0.113.9', 'curl/8.7.1', 400]]
  .map(([ip, userAgent, count]) => ({ count, dimensions: { clientIP: ip, clientCountryName: 'DE', userAgent } }));
const required = [{ count: 260, dimensions: { clientIP: '198.51.100.32', clientCountryName: 'FR', userAgent: browser } }];
const asked = [];
globalThis.fetch = async (url, init) => {
  if (String(url).endsWith('/cdn-cgi/trace')) return new Response('ip=203.0.113.9\\n');
  const { query } = JSON.parse(init.body);
  const addresses = /clientIP_in: (\\[[^\\]]*\\])/.exec(query);
  if (addresses) asked.push(JSON.parse(addresses[1]));
  writeFileSync(${JSON.stringify(join(dir, 'asked.json'))}, JSON.stringify(asked));
  const zone = addresses ? { quarters: days.filter(row => JSON.parse(addresses[1]).includes(row.dimensions.clientIP)) }
    : { total: [{ count: 7000 }], top, limited: [], refused, required, passes };
  return Response.json({ data: { viewer: { zones: [zone] } } });
};
`);
  });
  afterAll(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });

  it('finds the network that asked all day, and the visitor kept collected all day, whatever they called themselves', () => {
    const { stdout } = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--import', join(dir, 'cloudflare.mjs'),
      script, '--date=2026-11-18', '--json'], { encoding: 'utf8', timeout: 20_000,
      env: { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, CLOUDFLARE_API_TOKEN: 'none' } });
    const report = JSON.parse(stdout);
    expect(report.failures).toEqual([]);
    // Only the networks with 240 requests or more are read by quarter hour, this machine never.
    expect(asked()).toEqual([['198.51.100.7', '2001:db8:1:2::5', '2001:db8:1:2::6', '198.51.100.8']]);
    expect(report.traffic.sustained.map(({ network, quarterHours, busyQuarterHours }) => [network, quarterHours, busyQuarterHours]))
      .toEqual([['198.51.100.7', 34, 34], ['2001:db8:1:2::', 26, 0], ['198.51.100.8', 3, 3]]);
    expect(report.metrics).toMatchObject({ byClient: { verified: 900, map: 4000, app: 300, other: 450 },
      unverifiedDays: { 1: 80, '4-8': 12, '32+': 1 }, pastAllowance: 640, held: { allowance: 120, unbroken: 30, daily: 400, hourly: 0 },
      byReferrer: { browser: { own: 4900, other: 450, none: 20 }, app: { none: 300 } } });
    expect(Object.keys(report.metrics.byReferrer)).toEqual(['browser', 'app']);
    expect(Object.keys(report.metrics.byReferrer.browser)).toEqual(['own', 'other', 'none']);
    expect(report.traffic.passes).toEqual({ browser: { 204: 40, 403: 6, 503: 1 }, app: { 403: 2 } });
    expect(report.metrics.passRequired).toBe(260);
    expect(report.traffic.refused.map(({ network, requests }) => [network, requests])).toEqual([['198.51.100.30', 150], ['198.51.100.31', 3]]);
    expect(report.suspicions).toEqual([
      '198.51.100.7 (DE) asked in 34 quarter hours of the day, 34 of them 20 times or more (1020 requests)',
      '2001:db8:1:2:: (DE) asked in 26 quarter hours of the day, 0 of them 20 times or more (312 requests)',
      '450 requests came from clients that are none of our maps and apps and reached the cache: the Worker refuses them since 20 November 2026, unless MAP_PASS_SECRET is unset',
      '198.51.100.30 (DE) was refused 150 times (403, Mozilla/5.0): a script that got no scooters; watch whether it comes back naming a view',
      "260 requests of browsers without a map pass were answered 428 past their network's 20 of the day: a script naming a view, or riders Turnstile cannot check (networks at 428: 198.51.100.32 260)",
      "7 of 47 browsers' asks for a map pass failed (403 refused: 6, 503 not checked: 1): riders may be failing Turnstile, and get no scooters past their network's 20 requests of the day (requirePass: false in server/scooter-cache.ts turns that off)",
      "400 requests were held past their network's 1,500 a day (400) or 300 an hour (0): a script, or riders behind one address; find the network in Cloudflare's busiest",
      '1 visitor(s) without a map pass kept feeds collected in 32 quarter hours or more of the day',
    ]);
  });
});
