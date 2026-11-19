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
// The visitors' counters count a UTC quarter hour once it has closed, at the cache's first request or scrape
// (every 30 s) after it, so they are read a minute after the day's end and each quarter hour's. Read on the
// boundaries, until 10 November 2026, the day's last quarter hour was counted on neither day, and no sweep
// had a time.
const CLOSED = 60;

// What a suspicion is. A map now stops refreshing half an hour after the last touch; in the audit of
// 6 November 2026 the busiest outside browser made about 2,600 requests in a day, most under 900.
const BUSY_REQUESTS = 1500;
const SCRIPT_REQUESTS = 100;
const LIMITED_REQUESTS = 20;
// A network that asks all day, whatever its user agent: a map is looked at for a while, a script polling a town
// every few minutes never stops. A home server's script polling one town on 14 November 2026 asked in 32 quarter
// hours of the day (399 requests) and the script polling North Rhine-Westphalia on 18 November in 34, 28 of them
// with 20 requests or more (2,834); from 11 to 18 November no other outside network asked in more than 28, nor in
// more than 7 with 20 or more. Read by quarter hour for the networks with SUSTAINED_FROM requests or more.
const BUSY_QUARTER_REQUESTS = 20;
const BUSY_QUARTERS = 12;
const ACTIVE_QUARTERS = 24;
const ACTIVE_REQUESTS = 300;
const SUSTAINED_FROM = Math.min(BUSY_QUARTERS * BUSY_QUARTER_REQUESTS, ACTIVE_REQUESTS);
const SUSTAINED_NETWORKS = 100;
// Requests for scooters from clients the Worker found are none of our maps and apps, which the cache answers from
// what it holds since 18 November 2026 (src/lib/scooterClient.ts): our own scripts and tests make a few a day.
const OTHER_REQUESTS = 300;
// Browsers' asks for a map pass (POST /api/pass) that failed: Turnstile refused them (403, logged as
// map_pass_refused) or could not be asked (503, map_pass_unverified). Since 19 November 2026 a browser without a pass
// is held to 8 quarter hours of the day, so these are riders who get day-old scooters after 2 hours. On 18 and 19
// November, before that, none of 17 failed.
const PASS_FAILURES = 5;
const PASS_FAILURE_SHARE = 0.1;
// A browser, or our apps: the iPhone's (ScootRadar/… CFNetwork) and Android's (okhttp).
const appAgent = agent => /^ScootRadar\//.test(agent) || /^okhttp\//.test(agent);
const usualAgent = agent => /^Mozilla\/5\.0 /.test(agent) || appAgent(agent);
const agentKind = agent => appAgent(agent) ? 'app' : /^Mozilla\/5\.0 /.test(agent) ? 'browser' : 'other';

function prometheus(path) {
  const result = spawnSync('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15', 'netcup',
    `sudo -n docker exec ${PROMETHEUS} wget -q -O - '${`http://localhost:9090${path}`.replaceAll("'", "'\\''")}'`], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`Prometheus over ssh failed: ${(result.stderr || result.stdout).trim()}`);
  const body = JSON.parse(result.stdout);
  if (body.status !== 'success') throw new Error(`Prometheus: ${body.error}`);
  return body.data.result;
}
const instant = (query, at = dayEnd) => prometheus(`/api/v1/query?${new URLSearchParams({ query, time: String(at) })}`);
const value = (query, at) => Math.round(Number(instant(query, at)[0]?.value[1] ?? 0));
// In the buckets' order (server/visitorLedger.ts), which Prometheus does not keep.
const ORDER = ['1-15', '16-60', '61-300', '301+', '1', '2-3', '4-7', '4-8', '8-15', '9-15', '16-31', '32-63', '32+', '64+',
  'verified', 'map', 'app', 'other', 'allowance', 'busy', 'unbroken'];
const byLabel = (query, label, at) => Object.fromEntries(instant(query, at)
  .map(series => [series.metric[label], Math.round(Number(series.value[1]))])
  .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b)));

function cache() {
  const closed = dayEnd + CLOSED;
  // Each quarter hour by its start.
  const sweptAt = prometheus(`/api/v1/query_range?${new URLSearchParams({ query: `sum(increase(${SWEEPS}[15m]))`,
    start: String(closed - 86_400 + 900), end: String(closed), step: '900' })}`)[0]?.values
    .filter(([, count]) => Number(count) > 0.5).map(([at]) => new Date((at - 900 - CLOSED) * 1000).toISOString().slice(11, 16)) ?? [];
  return {
    visitorQuarterHours: value(`sum(increase(scootradar_visitors_total{${CACHE}}[24h]))`, closed),
    byRequests: byLabel(`sum by (requests) (increase(scootradar_visitors_total{${CACHE}}[24h]))`, 'requests', closed),
    byAreas: byLabel(`sum by (areas) (increase(scootradar_visitor_areas_total{${CACHE}}[24h]))`, 'areas', closed),
    sweeps: value(`sum(increase(${SWEEPS}[24h]))`, closed),
    sweptAt,
    unwatched: value(`sum(increase(scootradar_unwatched_requests_total{${CACHE}}[24h]))`),
    loweredZooms: value(`sum(increase(scootradar_scooter_zoom_lowered_total{${CACHE}}[24h]))`),
    limited: value(`sum(increase(scootradar_http_requests_total{${CACHE}, route="/api/scooters", status="429"}[24h]))`),
    limeRoundsVisitors: value(`sum(increase(scootradar_lime_wake_clients_total{${CACHE}, refreshes="16+"}[24h]))`, closed),
    // Counted at each request; the visitors of a day once it has closed, as the quarter hours'.
    byClient: byLabel(`sum by (client) (increase(scootradar_scooter_requests_by_client_total{${CACHE}}[24h]))`, 'client'),
    unverifiedDays: byLabel(`sum by (quarter_hours) (increase(scootradar_visitor_days_total{${CACHE}, client="unverified"}[24h]))`,
      'quarter_hours', closed),
    verifiedDays: byLabel(`sum by (quarter_hours) (increase(scootradar_visitor_days_total{${CACHE}, client="verified"}[24h]))`,
      'quarter_hours', closed),
    pastAllowance: value(`sum(increase(scootradar_past_allowance_requests_total{${CACHE}}[24h]))`),
    held: byLabel(`sum by (reason) (increase(scootradar_held_requests_total{${CACHE}}[24h]))`, 'reason'),
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

async function graphql(fields) {
  const query = `query($zone: String!, $date: Date!) { viewer { zones(filter: {zoneTag: $zone}) { ${fields} } } }`;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST',
    headers: { Authorization: `Bearer ${cloudflareToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { zone: ZONE, date } }), signal: AbortSignal.timeout(30_000) });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(`Cloudflare: ${body.errors?.map(error => error.message).join('; ') ?? response.status}`);
  return body.data.viewer.zones[0];
}

function cloudflare() {
  const groups = (alias, limit, filter) => `${alias}: httpRequestsAdaptiveGroups(limit: ${limit}, orderBy: [count_DESC],
    filter: {date: $date, clientRequestPath: "/api/scooters"${filter}}) { count dimensions { clientIP clientCountryName userAgent } }`;
  return graphql(`total: httpRequestsAdaptiveGroups(limit: 1, filter: {date: $date, clientRequestPath: "/api/scooters"}) { count }
    ${groups('top', 500, '')}
    ${groups('limited', 100, ', edgeResponseStatus: 429')}
    passes: httpRequestsAdaptiveGroups(limit: 1000, filter: {date: $date, clientRequestPath: "/api/pass", clientRequestHTTPMethodName: "POST"}) {
      count dimensions { clientIP userAgent edgeResponseStatus } }`);
}

// The asks for a map pass by who asked (browser, app, other) and status.
function passes(rows) {
  const counted = {};
  for (const { count, dimensions: { userAgent, edgeResponseStatus: status } } of rows) {
    const kind = agentKind(userAgent);
    counted[kind] ??= {};
    counted[kind][status] = (counted[kind][status] ?? 0) + count;
  }
  return counted;
}

// The requests of these addresses by quarter hour (at most 96 each, under Cloudflare's 10,000 rows). An answer
// Cloudflare sampled heavily misses quarter hours: in a first check of 14 November 2026 the home server's script
// had 16 of its 32, which every query before and since gave whole. Such an answer is asked for once more, and
// the fuller one kept.
async function quarterHours(addresses) {
  if (!addresses.length) return [];
  const ask = async () => (await graphql(`quarters: httpRequestsAdaptiveGroups(limit: 10000, filter: {date: $date,
    clientRequestPath: "/api/scooters", clientIP_in: ${JSON.stringify(addresses)}}) {
    count avg { sampleInterval } dimensions { clientIP datetimeFifteenMinutes } }`)).quarters;
  const first = await ask();
  if (!first.some(row => row.avg.sampleInterval >= 1.5)) return first;
  const second = await ask();
  return second.length > first.length ? second : first;
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
    const entry = merged.get(network) ?? { network, requests: 0, country: row.dimensions.clientCountryName, agents: new Map(),
      addresses: new Set() };
    entry.requests += row.count;
    entry.agents.set(row.dimensions.userAgent, (entry.agents.get(row.dimensions.userAgent) ?? 0) + row.count);
    entry.addresses.add(row.dimensions.clientIP);
    merged.set(network, entry);
  }
  return [...merged.values()].map(({ agents, ...entry }) => ({ ...entry,
    agents: [...agents].sort((a, b) => b[1] - a[1]).map(([agent, requests]) => ({ agent, requests })) }))
    .sort((a, b) => b.requests - a.requests);
}

// The quarter hours of the day each network asked in, and those it asked 20 times or more in.
async function sustained(outside) {
  const candidates = outside.filter(entry => entry.requests >= SUSTAINED_FROM).slice(0, SUSTAINED_NETWORKS);
  const quarters = new Map();
  for (const row of await quarterHours(candidates.flatMap(entry => [...entry.addresses]))) {
    const network = clientNetwork(row.dimensions.clientIP);
    const counts = quarters.get(network) ?? new Map();
    counts.set(row.dimensions.datetimeFifteenMinutes, (counts.get(row.dimensions.datetimeFifteenMinutes) ?? 0) + row.count);
    quarters.set(network, counts);
  }
  return candidates.map(({ network, country, requests, agents }) => {
    const counts = [...(quarters.get(network)?.values() ?? [])];
    return { network, country, requests, agent: agents[0].agent, quarterHours: counts.length,
      busyQuarterHours: counts.filter(count => count >= BUSY_QUARTER_REQUESTS).length };
  });
}

let metrics; let traffic;
let outsideNetworks = [];
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
  outsideNetworks = networks(outside);
  const plain = entry => Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'addresses'));
  traffic = { requests: zone.total[0]?.count ?? 0, own: Object.fromEntries(ownRows), busiest: outsideNetworks.slice(0, 10).map(plain),
    limited: networks(zone.limited.filter(row => !ownTraffic(row, mine, own))).map(plain), sustained: await sustained(outsideNetworks),
    passes: passes(zone.passes.filter(row => !ownTraffic(row, mine, own))) };
} catch (error) { failures.push(error.message); }

const suspicions = [];
if (metrics?.sweeps) suspicions.push(`${metrics.sweeps} visitor(s) asked for 32 areas or more in a quarter hour (UTC ${metrics.sweptAt.join(', ')})`);
if (metrics?.unwatched) suspicions.push(`${metrics.unwatched} requests past a visitor's 32 areas were not collected`);
if (metrics?.loweredZooms) suspicions.push(`${metrics.loweredZooms} requests asked for a box no screen shows at their zoom`);
for (const entry of outsideNetworks) {
  const scripted = entry.agents.filter(({ agent }) => !usualAgent(agent)).reduce((sum, { requests }) => sum + requests, 0);
  if (entry.requests >= BUSY_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) made ${entry.requests} requests`);
  else if (scripted >= SCRIPT_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) made ${scripted} requests with a script's user agent`);
}
for (const entry of traffic?.limited ?? []) {
  if (entry.requests >= LIMITED_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) was limited ${entry.requests} times`);
}
for (const entry of traffic?.sustained ?? []) {
  if (entry.busyQuarterHours >= BUSY_QUARTERS || (entry.quarterHours >= ACTIVE_QUARTERS && entry.requests >= ACTIVE_REQUESTS)) {
    suspicions.push(`${entry.network} (${entry.country}) asked in ${entry.quarterHours} quarter hours of the day, ${entry.busyQuarterHours} of them ${BUSY_QUARTER_REQUESTS} times or more (${entry.requests} requests)`);
  }
}
const otherRequests = metrics?.byClient.other ?? 0;
if (otherRequests >= OTHER_REQUESTS) suspicions.push(`${otherRequests} requests came from clients that are none of our maps and apps (answered from what the cache holds)`);
const browserPasses = traffic?.passes.browser ?? {};
const passesAsked = Object.values(browserPasses).reduce((sum, count) => sum + count, 0);
const passesFailed = (browserPasses[403] ?? 0) + (browserPasses[503] ?? 0);
if (passesFailed >= PASS_FAILURES && passesFailed >= passesAsked * PASS_FAILURE_SHARE) {
  suspicions.push(`${passesFailed} of ${passesAsked} browsers' asks for a map pass failed (403 refused: ${browserPasses[403] ?? 0}, 503 not checked: ${browserPasses[503] ?? 0}): riders may be failing Turnstile, and are held to 8 quarter hours a day (turn it off in server/scooter-cache.ts)`);
}
const allDay = metrics?.unverifiedDays['32+'] ?? 0;
if (allDay) suspicions.push(`${allDay} visitor(s) without a map pass kept feeds collected in 32 quarter hours or more of the day`);

if (args.includes('--json')) {
  console.log(JSON.stringify({ date, thisMachine: mine, metrics, traffic, suspicions, failures }, null, 2));
} else {
  const counts = record => Object.entries(record ?? {}).map(([key, count]) => `${key}: ${count}`).join(', ') || 'none';
  console.log(`Scraping check for ${date} (UTC)`);
  if (metrics) {
    console.log(`Cache: ${metrics.visitorQuarterHours} visitors over the quarter hours; by requests ${counts(metrics.byRequests)}; by areas ${counts(metrics.byAreas)}`);
    console.log(`  sweeps ${metrics.sweeps}, uncollected ${metrics.unwatched}, boxes too large ${metrics.loweredZooms}, origin 429s ${metrics.limited}, visitors with 16+ Lime refreshes ${metrics.limeRoundsVisitors}`);
    console.log(`  requests by client ${counts(metrics.byClient)}; visitors by quarter hours kept collected, without a pass ${counts(metrics.unverifiedDays)}, with one ${counts(metrics.verifiedDays)}; requests past the allowance ${metrics.pastAllowance}; held ${counts(metrics.held)}`);
  }
  if (traffic) {
    console.log(`Cloudflare /api/scooters: ${traffic.requests} requests (sampled); ours: ${counts(traffic.own)}`);
    console.log('Busiest outside networks:');
    for (const entry of traffic.busiest) console.log(`  ${String(entry.requests).padStart(6)}  ${entry.network}  ${entry.country}  ${entry.agents[0].agent.slice(0, 90)}`);
    console.log(`Limited (429): ${traffic.limited.map(entry => `${entry.network} ${entry.requests}`).join(', ') || 'none'}`);
    console.log(`Map passes asked (POST /api/pass, by status): ${Object.entries(traffic.passes).map(([kind, statuses]) => `${kind} ${counts(statuses)}`).join('; ') || 'none'}`);
    console.log(`Quarter hours asked in (busy: ${BUSY_QUARTER_REQUESTS}+ requests), networks with ${SUSTAINED_FROM}+ requests:`);
    for (const entry of [...traffic.sustained].sort((a, b) => b.quarterHours - a.quarterHours).slice(0, 10)) {
      console.log(`  ${String(entry.quarterHours).padStart(3)} (${String(entry.busyQuarterHours).padStart(2)} busy)  ${entry.network}  ${entry.country}  ${entry.requests}  ${entry.agent.slice(0, 70)}`);
    }
  }
  for (const failure of failures) console.log(`Not read: ${failure}`);
  console.log(suspicions.length ? `Suspicions:\n${suspicions.map(line => `  - ${line}`).join('\n')}` : 'Nothing suspicious.');
}
process.exitCode = failures.length ? 2 : suspicions.length ? 1 : 0;
