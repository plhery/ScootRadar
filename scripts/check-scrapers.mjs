import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { clientNetwork } from '../src/lib/clientNetwork.ts';

const usage = `Usage: node scripts/check-scrapers.mjs [--date=YYYY-MM-DD] [--own=IP,IP] [--json]
The day's scraping check (yesterday UTC unless --date= names another): the cache's visitor metrics from Prometheus
over ssh netcup, and the busiest clients of /api/scooters and those limited from Cloudflare's analytics, with
CLOUDFLARE_API_TOKEN or wrangler's login. Our own traffic is set apart: this machine, the Worker's cache writes, our
scripts' user agents, Google Play's pre-launch robots and --own=. Exits 1 on a suspicion, 2 when a source fails.
See docs/OBSERVABILITY.md, "Scraping".`;

const args = process.argv.slice(2);
if (args.includes('--help')) { console.log(usage); process.exit(0); }
for (const arg of args) {
  if (!/^--(date=\d{4}-\d{2}-\d{2}|own=.+|json)$/.test(arg)) { console.error(`Unknown option ${arg}\n${usage}`); process.exit(2); }
}
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const date = option('date') ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const dayEnd = Math.min(Date.parse(`${date}T00:00:00Z`) + 86_400_000, Date.now()) / 1000;

const ZONE = '79c6a39db1a26ea42f9c97eb7d6cef3e'; // scootradar.com
const PROMETHEUS = process.env.PROMETHEUS_CONTAINER ?? 'p13mhgbtnebkwu8rutbtz6mk';
const CACHE = 'job="scootradar-cache"';
const SWEEPS = `scootradar_visitor_areas_total{${CACHE}, areas=~"32-63|64\\\\+"}`;

// What a suspicion is. A map now stops refreshing half an hour after the last touch; in the audit of
// 6 November 2026 the busiest outside browser made about 2,600 requests in a day, most under 900.
const BUSY_REQUESTS = 1500;
const SCRIPT_REQUESTS = 100;
const LIMITED_REQUESTS = 20;
// A browser, or our apps: the iPhone's (ScootRadar/… CFNetwork) and Android's (okhttp).
const usualAgent = agent => /^Mozilla\/5\.0 /.test(agent) || /^ScootRadar\//.test(agent) || /^okhttp\//.test(agent);

function prometheus(path) {
  const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', 'netcup',
    `sudo -n docker exec ${PROMETHEUS} wget -q -O - '${`http://localhost:9090${path}`.replaceAll("'", "'\\''")}'`], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Prometheus over ssh failed: ${(result.stderr || result.stdout).trim()}`);
  const body = JSON.parse(result.stdout);
  if (body.status !== 'success') throw new Error(`Prometheus: ${body.error}`);
  return body.data.result;
}
const instant = query => prometheus(`/api/v1/query?${new URLSearchParams({ query, time: String(dayEnd) })}`);
const value = query => Math.round(Number(instant(query)[0]?.value[1] ?? 0));
// In the buckets' order (server/visitorLedger.ts), which Prometheus does not keep.
const ORDER = ['1-15', '16-60', '61-300', '301+', '1', '2-3', '4-7', '8-15', '16-31', '32-63', '64+'];
const byLabel = (query, label) => Object.fromEntries(instant(query)
  .map(series => [series.metric[label], Math.round(Number(series.value[1]))])
  .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b)));

function cache() {
  const sweptAt = prometheus(`/api/v1/query_range?${new URLSearchParams({ query: `sum(increase(${SWEEPS}[15m]))`,
    start: String(dayEnd - 86_400 + 900), end: String(dayEnd), step: '900' })}`)[0]?.values
    .filter(([, count]) => Number(count) > 0.5).map(([at]) => new Date((at - 900) * 1000).toISOString().slice(11, 16)) ?? [];
  return {
    visitorQuarterHours: value(`sum(increase(scootradar_visitors_total{${CACHE}}[24h]))`),
    byRequests: byLabel(`sum by (requests) (increase(scootradar_visitors_total{${CACHE}}[24h]))`, 'requests'),
    byAreas: byLabel(`sum by (areas) (increase(scootradar_visitor_areas_total{${CACHE}}[24h]))`, 'areas'),
    sweeps: value(`sum(increase(${SWEEPS}[24h]))`),
    sweptAt,
    unwatched: value(`sum(increase(scootradar_unwatched_requests_total{${CACHE}}[24h]))`),
    loweredZooms: value(`sum(increase(scootradar_scooter_zoom_lowered_total{${CACHE}}[24h]))`),
    limited: value(`sum(increase(scootradar_http_requests_total{${CACHE}, route="/api/scooters", status="429"}[24h]))`),
    limeRoundsVisitors: value(`sum(increase(scootradar_lime_wake_clients_total{${CACHE}, refreshes="16+"}[24h]))`),
  };
}

function cloudflareToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  // wrangler renews its login's token, which lasts an hour, on any call.
  spawnSync('npx', ['wrangler', 'whoami'], { encoding: 'utf8' });
  const config = readFileSync(`${homedir()}/Library/Preferences/.wrangler/config/default.toml`, 'utf8');
  const token = /^oauth_token\s*=\s*"([^"]+)"/m.exec(config)?.[1];
  if (!token) throw new Error('No CLOUDFLARE_API_TOKEN and no wrangler login (npx wrangler login)');
  return token;
}

async function cloudflare() {
  const groups = (alias, limit, filter) => `${alias}: httpRequestsAdaptiveGroups(limit: ${limit}, orderBy: [count_DESC],
    filter: {date: $date, clientRequestPath: "/api/scooters"${filter}}) { count dimensions { clientIP clientCountryName userAgent } }`;
  const query = `query($zone: String!, $date: Date!) { viewer { zones(filter: {zoneTag: $zone}) {
    total: httpRequestsAdaptiveGroups(limit: 1, filter: {date: $date, clientRequestPath: "/api/scooters"}) { count }
    ${groups('top', 500, '')}
    ${groups('limited', 100, ', edgeResponseStatus: 429')} } } }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST',
    headers: { Authorization: `Bearer ${cloudflareToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { zone: ZONE, date } }), signal: AbortSignal.timeout(30_000) });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(`Cloudflare: ${body.errors?.map(error => error.message).join('; ') ?? response.status}`);
  return body.data.viewer.zones[0];
}

async function thisMachine() {
  try {
    const trace = await (await fetch('https://scootradar.com/cdn-cgi/trace', { signal: AbortSignal.timeout(10_000) })).text();
    return /^ip=(.+)$/m.exec(trace)?.[1];
  } catch {
    return undefined;
  }
}

function ownTraffic(row, mine, own) {
  const { clientIP: ip, userAgent: agent } = row.dimensions;
  if (mine && clientNetwork(ip) === clientNetwork(mine)) return 'this machine';
  if (own.has(clientNetwork(ip))) return '--own';
  if (ip === '2a06:98c0:3600::103') return "the Worker's cache writes";
  if (/^scootradar-/.test(agent)) return 'our scripts';
  if (/^okhttp\//.test(agent) && ip.startsWith('2001:4860:')) return "Google Play's pre-launch robots";
  return undefined;
}

// Rows of one network (an IPv6 /64), with their busiest user agent and country.
function networks(rows) {
  const merged = new Map();
  for (const row of rows) {
    const network = clientNetwork(row.dimensions.clientIP);
    const entry = merged.get(network) ?? { network, requests: 0, country: row.dimensions.clientCountryName, agents: new Map() };
    entry.requests += row.count;
    entry.agents.set(row.dimensions.userAgent, (entry.agents.get(row.dimensions.userAgent) ?? 0) + row.count);
    merged.set(network, entry);
  }
  return [...merged.values()].map(({ agents, ...entry }) => ({ ...entry,
    agents: [...agents].sort((a, b) => b[1] - a[1]).map(([agent, requests]) => ({ agent, requests })) }))
    .sort((a, b) => b.requests - a.requests);
}

let metrics; let traffic;
const failures = [];
try { metrics = cache(); } catch (error) { failures.push(error.message); }
const mine = await thisMachine();
const own = new Set((option('own') ?? '').split(',').filter(Boolean).map(clientNetwork));
try {
  const zone = await cloudflare();
  const ownRows = new Map();
  const outside = zone.top.filter(row => {
    const whose = ownTraffic(row, mine, own);
    if (whose) ownRows.set(whose, (ownRows.get(whose) ?? 0) + row.count);
    return !whose;
  });
  traffic = { requests: zone.total[0]?.count ?? 0, own: Object.fromEntries(ownRows), busiest: networks(outside).slice(0, 10),
    limited: networks(zone.limited.filter(row => !ownTraffic(row, mine, own))) };
} catch (error) { failures.push(error.message); }

const suspicions = [];
if (metrics?.sweeps) suspicions.push(`${metrics.sweeps} visitor(s) asked for 32 areas or more in a quarter hour (UTC ${metrics.sweptAt.join(', ')})`);
if (metrics?.unwatched) suspicions.push(`${metrics.unwatched} requests past a visitor's 32 areas were not collected`);
if (metrics?.loweredZooms) suspicions.push(`${metrics.loweredZooms} requests asked for a box no screen shows at their zoom`);
for (const entry of traffic?.busiest ?? []) {
  const scripted = entry.agents.filter(({ agent }) => !usualAgent(agent)).reduce((sum, { requests }) => sum + requests, 0);
  if (entry.requests >= BUSY_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) made ${entry.requests} requests`);
  else if (scripted >= SCRIPT_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) made ${scripted} requests with a script's user agent`);
}
for (const entry of traffic?.limited ?? []) {
  if (entry.requests >= LIMITED_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) was limited ${entry.requests} times`);
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ date, thisMachine: mine, metrics, traffic, suspicions, failures }, null, 2));
} else {
  const counts = record => Object.entries(record ?? {}).map(([key, count]) => `${key}: ${count}`).join(', ') || 'none';
  console.log(`Scraping check for ${date} (UTC)`);
  if (metrics) {
    console.log(`Cache: ${metrics.visitorQuarterHours} visitors over the quarter hours; by requests ${counts(metrics.byRequests)}; by areas ${counts(metrics.byAreas)}`);
    console.log(`  sweeps ${metrics.sweeps}, uncollected ${metrics.unwatched}, boxes too large ${metrics.loweredZooms}, origin 429s ${metrics.limited}, visitors with 16+ Lime refreshes ${metrics.limeRoundsVisitors}`);
  }
  if (traffic) {
    console.log(`Cloudflare /api/scooters: ${traffic.requests} requests (sampled); ours: ${counts(traffic.own)}`);
    console.log('Busiest outside networks:');
    for (const entry of traffic.busiest) console.log(`  ${String(entry.requests).padStart(6)}  ${entry.network}  ${entry.country}  ${entry.agents[0].agent.slice(0, 90)}`);
    console.log(`Limited (429): ${traffic.limited.map(entry => `${entry.network} ${entry.requests}`).join(', ') || 'none'}`);
  }
  for (const failure of failures) console.log(`Not read: ${failure}`);
  console.log(suspicions.length ? `Suspicions:\n${suspicions.map(line => `  - ${line}`).join('\n')}` : 'Nothing suspicious.');
}
process.exitCode = failures.length ? 2 : suspicions.length ? 1 : 0;
