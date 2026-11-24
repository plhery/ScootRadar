import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { clientNetwork } from '../src/lib/clientNetwork.ts';
import { readBanLine } from '../src/lib/scooterBanLines.ts';

const usage = `Usage: node scripts/check-scrapers.mjs [--date=YYYY-MM-DD] [--own=IP,IP] [--json]
The day's scraping check (yesterday UTC unless --date= names another): the cache's visitor metrics from Prometheus
over ssh netcup, and the busiest clients of /api/scooters and those limited from Cloudflare's analytics, with
CLOUDFLARE_API_TOKEN or wrangler's login. Our own traffic is set apart: this machine, the Worker's cache writes, our
scripts' user agents, Google Play's pre-launch robots and --own=. It also reads the account's Workers against the
Workers Free plan: requests stopped past its limits, and the day's requests. Exits 1 on a suspicion, 2 when a
source fails. Today's covers the day so far. See docs/OBSERVABILITY.md, "Scraping".`;

const args = process.argv.slice(2);
if (args.includes('--help')) { console.log(usage); process.exit(0); }
for (const arg of args) {
  if (!/^--(date=\d{4}-\d{2}-\d{2}|own=.+|json)$/.test(arg)) { console.error(`Unknown option ${arg}\n${usage}`); process.exit(2); }
}
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const date = option('date') ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const dayStart = Date.parse(`${date}T00:00:00Z`) / 1000;
const dayEnd = Math.min(dayStart + 86_400, Date.now() / 1000);
// The cache's counters are read over the day, today's so far: over 24 hours, today's took in yesterday's evening.
const DAY_S = Math.max(60, Math.round(dayEnd - dayStart));
const DAY = `${DAY_S}s`;

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
// Requests for scooters from clients the Worker found are none of our maps and apps (src/lib/scooterClient.ts). Since
// 20 November 2026 the Worker refuses them (403) and our scripts carry its audit token: one at the cache means the
// refusal is off (MAP_PASS_SECRET unset). Before, the cache answered them from what it held.
const OTHER_REQUESTS = 1;
// A network the Worker refused (403, as one that is none of our maps and apps) or a WAF rule blocked this often: a
// script that got no scooters. Watch whether it comes back as a map, naming a view.
const REFUSED_REQUESTS = 100;
// Requests of browsers without a map pass past their network's 20 answers of the day, which the cache answers 428
// until they hold one (server/visitorLedger.ts, PASS_GRACE_REQUESTS): a script that names a view under a browser's
// user agent, or a rider Turnstile cannot check, whose map asks again every few seconds.
const PASS_REQUIRED = 200;
// Browsers' asks for a map pass (POST /api/pass) that failed: Turnstile refused them (403, logged as
// map_pass_refused) or could not be asked (503, map_pass_unverified). Since 20 November 2026 a browser without a pass
// gets no scooters past its network's 20 requests of the day (from 19 November, day-old ones past 8 quarter hours), so
// these are riders who see none. On 18 and 19 November, before either, none of 17 failed.
const PASS_FAILURES = 5;
const PASS_FAILURE_SHARE = 0.1;
// Requests held past their network's 1,500 a day (daily) or 300 an hour (hourly), since VISITOR_COUNT_SECRET is set
// on the cache (server/visitorLedger.ts). From 12 to 18 November 2026 no rider or app came near either; a network
// held is a script, or many riders behind one address (a carrier's NAT, a school, a hotel) getting old scooters.
const NETWORK_HOLDS = 1;
// The account is on the Workers Free plan (DEPLOY.md): 100,000 requests a UTC day for all its Workers together, past
// which each answers error 1027 until midnight UTC, and 10 ms of CPU a request, past which Cloudflare may stop one
// (exceededResources: the visitor gets error 1102). It lets the site's longer page renders run, but stopped 210 in
// the hour from 14:00 UTC on 30 October 2026. Any request that ends otherwise than answered (or its client gone) is
// a suspicion, as is a day past half the requests; the busiest so far had 31,700 (1 November 2026).
const WORKER_REQUESTS = 50_000;
const ANSWERED = new Set(['success', 'clientDisconnected']);
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
  'verified', 'map', 'app', 'other', 'allowance', 'busy', 'unbroken', 'daily', 'hourly'];
const byLabel = (query, label, at) => Object.fromEntries(instant(query, at)
  .map(series => [series.metric[label], Math.round(Number(series.value[1]))])
  .sort(([a], [b]) => ORDER.indexOf(a) - ORDER.indexOf(b)));
// By two labels, in `order`: { browser: { own: 10, none: 2 }, app: { none: 5 } }.
const byLabels = (query, outer, inner, order) => {
  const nested = {};
  for (const series of [...instant(query)].sort((a, b) => order.indexOf(a.metric[outer]) - order.indexOf(b.metric[outer])
    || order.indexOf(a.metric[inner]) - order.indexOf(b.metric[inner]))) {
    (nested[series.metric[outer]] ??= {})[series.metric[inner]] = Math.round(Number(series.value[1]));
  }
  return nested;
};

function cache() {
  const closed = dayEnd + CLOSED;
  // Each quarter hour by its start.
  const sweptAt = DAY_S < 900 ? [] : prometheus(`/api/v1/query_range?${new URLSearchParams({ query: `sum(increase(${SWEEPS}[15m]))`,
    start: String(closed - DAY_S + 900), end: String(closed), step: '900' })}`)[0]?.values
    .filter(([, count]) => Number(count) > 0.5).map(([at]) => new Date((at - 900 - CLOSED) * 1000).toISOString().slice(11, 16)) ?? [];
  return {
    visitorQuarterHours: value(`sum(increase(scootradar_visitors_total{${CACHE}}[${DAY}]))`, closed),
    byRequests: byLabel(`sum by (requests) (increase(scootradar_visitors_total{${CACHE}}[${DAY}]))`, 'requests', closed),
    byAreas: byLabel(`sum by (areas) (increase(scootradar_visitor_areas_total{${CACHE}}[${DAY}]))`, 'areas', closed),
    sweeps: value(`sum(increase(${SWEEPS}[${DAY}]))`, closed),
    sweptAt,
    unwatched: value(`sum(increase(scootradar_unwatched_requests_total{${CACHE}}[${DAY}]))`),
    loweredZooms: value(`sum(increase(scootradar_scooter_zoom_lowered_total{${CACHE}}[${DAY}]))`),
    limited: value(`sum(increase(scootradar_http_requests_total{${CACHE}, route="/api/scooters", status="429"}[${DAY}]))`),
    limeRoundsVisitors: value(`sum(increase(scootradar_lime_wake_clients_total{${CACHE}, refreshes="16+"}[${DAY}]))`, closed),
    // Counted at each request; the visitors of a day once it has closed, as the quarter hours'.
    byClient: byLabel(`sum by (client) (increase(scootradar_scooter_requests_by_client_total{${CACHE}}[${DAY}]))`, 'client'),
    unverifiedDays: byLabel(`sum by (quarter_hours) (increase(scootradar_visitor_days_total{${CACHE}, client="unverified"}[${DAY}]))`,
      'quarter_hours', closed),
    verifiedDays: byLabel(`sum by (quarter_hours) (increase(scootradar_visitor_days_total{${CACHE}, client="verified"}[${DAY}]))`,
      'quarter_hours', closed),
    pastAllowance: value(`sum(increase(scootradar_past_allowance_requests_total{${CACHE}}[${DAY}]))`),
    held: byLabel(`sum by (reason) (increase(scootradar_held_requests_total{${CACHE}}[${DAY}]))`, 'reason'),
    passRequired: value(`sum(increase(scootradar_pass_required_total{${CACHE}}[${DAY}]))`),
    // Counted since 19 November 2026, for a week before deciding whether a browser without our referrer is held.
    byReferrer: byLabels(`sum by (agent, referrer) (increase(scootradar_scooter_requests_by_referrer_total{${CACHE}}[${DAY}]))`,
      'agent', 'referrer', ['browser', 'app', 'own', 'other', 'none']),
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

// The zone's datasets, or with `account` the account's (its Workers').
// The zone's account, asked rather than written here: the repository is public.
async function accountOfZone() {
  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}`, {
    headers: { Authorization: `Bearer ${cloudflareToken()}` }, signal: AbortSignal.timeout(30_000) });
  const body = await response.json();
  if (!response.ok || !body.result?.account?.id) throw new Error(`Cloudflare: no account for the zone (${response.status})`);
  return body.result.account.id;
}

async function graphql(fields, { account = false } = {}) {
  const scope = account ? 'accounts(filter: {accountTag: $tag})' : 'zones(filter: {zoneTag: $tag})';
  const query = `query($tag: String!, $date: Date!) { viewer { ${scope} { ${fields} } } }`;
  const tag = account ? await accountOfZone() : ZONE;
  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST',
    headers: { Authorization: `Bearer ${cloudflareToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { tag, date } }), signal: AbortSignal.timeout(30_000) });
  const body = await response.json();
  if (!response.ok || body.errors?.length) throw new Error(`Cloudflare: ${body.errors?.map(error => error.message).join('; ') ?? response.status}`);
  const found = account ? body.data?.viewer.accounts?.[0] : body.data?.viewer.zones?.[0];
  if (!found) throw new Error(`Cloudflare: no ${account ? 'account' : 'zone'} in the answer`);
  return found;
}

// The account's Worker requests of the day by Worker, those that ended otherwise than answered, and the site's CPU
// time a request (sampled, as Cloudflare's analytics are).
async function workers() {
  const day = await graphql(`invocations: workersInvocationsAdaptive(limit: 1000, filter: {date: $date}) {
      sum { requests } dimensions { scriptName status } }
    cpu: workersInvocationsAdaptive(limit: 1, filter: {date: $date, scriptName: "swiss-scooters"}) {
      quantiles { cpuTimeP50 cpuTimeP90 cpuTimeP99 } }`, { account: true });
  const byWorker = {}; const stopped = [];
  for (const { sum: { requests }, dimensions: { scriptName: worker, status } } of day.invocations) {
    byWorker[worker] = (byWorker[worker] ?? 0) + requests;
    if (!ANSWERED.has(status)) stopped.push({ worker, status, requests });
  }
  const quantiles = day.cpu[0]?.quantiles;
  const ms = microseconds => Math.round(microseconds / 100) / 10;
  return { requests: Object.values(byWorker).reduce((sum, count) => sum + count, 0),
    byWorker: Object.fromEntries(Object.entries(byWorker).sort(([, a], [, b]) => b - a)),
    stopped: stopped.sort((a, b) => b.requests - a.requests),
    cpuMs: quantiles ? { p50: ms(quantiles.cpuTimeP50), p90: ms(quantiles.cpuTimeP90), p99: ms(quantiles.cpuTimeP99) } : null };
}

function cloudflare() {
  const groups = (alias, limit, filter) => `${alias}: httpRequestsAdaptiveGroups(limit: ${limit}, orderBy: [count_DESC],
    filter: {date: $date, clientRequestPath: "/api/scooters"${filter}}) { count dimensions { clientIP clientCountryName userAgent } }`;
  return graphql(`total: httpRequestsAdaptiveGroups(limit: 1, filter: {date: $date, clientRequestPath: "/api/scooters"}) { count }
    ${groups('top', 500, '')}
    ${groups('limited', 100, ', edgeResponseStatus: 429')}
    ${groups('refused', 100, ', edgeResponseStatus: 403')}
    ${groups('required', 100, ', edgeResponseStatus: 428')}
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

let metrics; let traffic; let account;
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
    limited: networks(zone.limited.filter(row => !ownTraffic(row, mine, own))).map(plain),
    refused: networks(zone.refused.filter(row => !ownTraffic(row, mine, own))).map(plain),
    required: networks(zone.required.filter(row => !ownTraffic(row, mine, own))).map(plain), sustained: await sustained(outsideNetworks),
    passes: passes(zone.passes.filter(row => !ownTraffic(row, mine, own))) };
} catch (error) { failures.push(error.message); }
try { account = await workers(); } catch (error) { failures.push(`Workers: ${error.message}`); }

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
if (otherRequests >= OTHER_REQUESTS) suspicions.push(`${otherRequests} requests came from clients that are none of our maps and apps and reached the cache: the Worker refuses them since 20 November 2026, unless MAP_PASS_SECRET is unset`);
for (const entry of traffic?.refused ?? []) {
  if (entry.requests >= REFUSED_REQUESTS) suspicions.push(`${entry.network} (${entry.country}) was refused ${entry.requests} times (403, ${entry.agents[0].agent.slice(0, 60)}): a script that got no scooters; watch whether it comes back naming a view`);
}
const passRequired = metrics?.passRequired ?? 0;
if (passRequired >= PASS_REQUIRED) {
  suspicions.push(`${passRequired} requests of browsers without a map pass were answered 428 past their network's 20 of the day: a script naming a view, or riders Turnstile cannot check (networks at 428: ${traffic?.required.slice(0, 5).map(entry => `${entry.network} ${entry.requests}`).join(', ') || 'not read'})`);
}
const browserPasses = traffic?.passes.browser ?? {};
const passesAsked = Object.values(browserPasses).reduce((sum, count) => sum + count, 0);
const passesFailed = (browserPasses[403] ?? 0) + (browserPasses[503] ?? 0);
if (passesFailed >= PASS_FAILURES && passesFailed >= passesAsked * PASS_FAILURE_SHARE) {
  suspicions.push(`${passesFailed} of ${passesAsked} browsers' asks for a map pass failed (403 refused: ${browserPasses[403] ?? 0}, 503 not checked: ${browserPasses[503] ?? 0}): riders may be failing Turnstile, and get no scooters past their network's 20 requests of the day (requirePass: false in server/scooter-cache.ts turns that off)`);
}
const networkHolds = (metrics?.held.daily ?? 0) + (metrics?.held.hourly ?? 0);
if (networkHolds >= NETWORK_HOLDS) {
  suspicions.push(`${networkHolds} requests were held past their network's 1,500 a day (${metrics.held.daily ?? 0}) or 300 an hour (${metrics.held.hourly ?? 0}): a script, or riders behind one address; find the network in Cloudflare's busiest`);
}
const allDay = metrics?.unverifiedDays['32+'] ?? 0;
if (allDay) suspicions.push(`${allDay} visitor(s) without a map pass kept feeds collected in 32 quarter hours or more of the day`);

for (const { worker, status, requests } of account?.stopped ?? []) {
  suspicions.push(/^exceeded/.test(status)
    ? `${requests} requests to the Worker ${worker} were stopped past the Workers Free plan's limits (${status}: 10 ms of CPU or 128 MB a request), and their visitors got Cloudflare's error 1102: Workers Paid, $5 a month, lifts the CPU limit (DEPLOY.md)`
    : `${requests} requests to the Worker ${worker} ended ${status}, not answered`);
}
if (account?.requests >= WORKER_REQUESTS) {
  const byWorker = Object.entries(account.byWorker).map(([worker, count]) => `${worker} ${count}`).join(', ');
  suspicions.push(`The account's Workers had ${account.requests} requests (${byWorker}): past 100,000 in a UTC day, the Workers Free plan answers all of them with error 1027 until midnight UTC (DEPLOY.md)`);
}

// The networks banned for a while (the Worker secret SCOOTER_BANS, src/lib/scooterBans.ts), as this machine keeps the
// list, read line by line as the Worker reads them (src/lib/scooterBanLines.ts). A ban ends by itself, but its line
// stays until deleted, and the privacy policy keeps an address only while its ban lasts: those ended are named, to be
// deleted and the list put again. A line the Worker cannot read bans nothing: it is not counted in force, and its
// number is given, a suspicion, as the network it names is not banned (until 24 November 2026 a /64 written with
// `/64`, or an end with an offset, was counted in force here and skipped by the Worker; week review of 24 November
// 2026, W3). Null without a list here.
const BANS_FILE = process.env.SCOOTRADAR_BANS_FILE ?? `${homedir()}/.config/scootradar/scooter-bans`;
function bans() {
  let text;
  try { text = readFileSync(BANS_FILE, 'utf8'); } catch { return null; }
  const lines = text.split(/\r?\n/).map((line, index) => ({ written: line.trim().split(/\s+/)[0], number: index + 1,
    ban: readBanLine(line, clientNetwork) })).filter(line => line.ban);
  const read = lines.filter(line => !('unread' in line.ban));
  const ended = read.filter(line => line.ban.ends <= Date.now());
  return { inForce: read.length - ended.length, ended: ended.map(line => line.written),
    unread: lines.filter(line => 'unread' in line.ban).map(line => line.number) };
}
const banned = bans();
if (banned?.unread.length) {
  suspicions.push(`Line(s) ${banned.unread.join(', ')} of ${BANS_FILE} ban nothing: the Worker cannot read them; write the network and its end as docs/OBSERVABILITY.md, "Scraping", shows, and put the list again`);
}

if (args.includes('--json')) {
  console.log(JSON.stringify({ date, thisMachine: mine, metrics, traffic, workers: account, bans: banned, suspicions, failures }, null, 2));
} else {
  const counts = record => Object.entries(record ?? {}).map(([key, count]) => `${key}: ${count}`).join(', ') || 'none';
  console.log(`Scraping check for ${date} (UTC)`);
  if (metrics) {
    console.log(`Cache: ${metrics.visitorQuarterHours} visitors over the quarter hours; by requests ${counts(metrics.byRequests)}; by areas ${counts(metrics.byAreas)}`);
    console.log(`  sweeps ${metrics.sweeps}, uncollected ${metrics.unwatched}, boxes too large ${metrics.loweredZooms}, origin 429s ${metrics.limited}, visitors with 16+ Lime refreshes ${metrics.limeRoundsVisitors}`);
    console.log(`  requests by client ${counts(metrics.byClient)}; visitors by quarter hours kept collected, without a pass ${counts(metrics.unverifiedDays)}, with one ${counts(metrics.verifiedDays)}; requests past the allowance ${metrics.pastAllowance}; held ${counts(metrics.held)}; asked for a pass first (428) ${metrics.passRequired}`);
    console.log(`  requests by referrer: ${Object.entries(metrics.byReferrer).map(([agent, referrers]) => `${agent} ${counts(referrers)}`).join('; ') || 'none'}`);
  }
  if (traffic) {
    console.log(`Cloudflare /api/scooters: ${traffic.requests} requests (sampled); ours: ${counts(traffic.own)}`);
    console.log('Busiest outside networks:');
    for (const entry of traffic.busiest) console.log(`  ${String(entry.requests).padStart(6)}  ${entry.network}  ${entry.country}  ${entry.agents[0].agent.slice(0, 90)}`);
    console.log(`Limited (429): ${traffic.limited.map(entry => `${entry.network} ${entry.requests}`).join(', ') || 'none'}`);
    console.log(`Refused (403, the Worker or a WAF rule): ${traffic.refused.map(entry => `${entry.network} ${entry.country} ${entry.requests} ${entry.agents[0].agent.slice(0, 40)}`).join(', ') || 'none'}`);
    console.log(`Asked for a pass first (428): ${traffic.required.map(entry => `${entry.network} ${entry.requests}`).join(', ') || 'none'}`);
    console.log(`Map passes asked (POST /api/pass, by status): ${Object.entries(traffic.passes).map(([kind, statuses]) => `${kind} ${counts(statuses)}`).join('; ') || 'none'}`);
    console.log(`Quarter hours asked in (busy: ${BUSY_QUARTER_REQUESTS}+ requests), networks with ${SUSTAINED_FROM}+ requests:`);
    for (const entry of [...traffic.sustained].sort((a, b) => b.quarterHours - a.quarterHours).slice(0, 10)) {
      console.log(`  ${String(entry.quarterHours).padStart(3)} (${String(entry.busyQuarterHours).padStart(2)} busy)  ${entry.network}  ${entry.country}  ${entry.requests}  ${entry.agent.slice(0, 70)}`);
    }
  }
  if (account) {
    const cpu = account.cpuMs ? `; swiss-scooters' CPU a request p50 ${account.cpuMs.p50} ms, p90 ${account.cpuMs.p90}, p99 ${account.cpuMs.p99}` : '';
    const stopped = account.stopped.map(({ worker, status, requests }) => `${worker} ${status} ${requests}`).join(', ') || 'none';
    console.log(`Workers (Free plan: 100,000 requests a day for the account, 10 ms of CPU a request): ${account.requests} requests (sampled), by Worker ${counts(account.byWorker)}; not answered ${stopped}${cpu}`);
  }
  console.log(!banned ? `Bans (SCOOTER_BANS): no list at ${BANS_FILE}`
    : `Bans (SCOOTER_BANS): ${banned.inForce} in force${banned.ended.length ? `; ended, to delete from ${BANS_FILE} and put the list again (docs/OBSERVABILITY.md, "Scraping"): ${banned.ended.join(', ')}` : ''}${banned.unread.length ? `; not read, banning nothing: line(s) ${banned.unread.join(', ')}` : ''}`);
  for (const failure of failures) console.log(`Not read: ${failure}`);
  console.log(suspicions.length ? `Suspicions:\n${suspicions.map(line => `  - ${line}`).join('\n')}` : 'Nothing suspicious.');
}
process.exitCode = failures.length ? 2 : suspicions.length ? 1 : 0;
