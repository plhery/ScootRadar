import { expect, it } from 'vitest';
import { createSnapshotMetrics } from './metrics';
import { buildCityOverview, VEHICLE_MAX_AGE_MS, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';

const now = 1_800_000_000_000;
const feed = (changes: Partial<FeedSnapshot>): FeedSnapshot => ({ id: 'national:voiscooters.com', source: 'national',
  provider: 'voi', coverage: [], vehicles: [], observedAt: now - 60_000, attemptedAt: now - 30_000, stale: false,
  failed: false, skipped: false, ...changes });
const snapshot = (feeds: FeedSnapshot[]): MobilitySnapshot => ({ version: 1, updatedAt: now - 5_000, feeds,
  overview: buildCityOverview(feeds, now - 600_000) });
const sample = (text: string, line: string) => text.split('\n').find(candidate => candidate.startsWith(`${line} `))?.split(' ')[1];

it('exports the state of every attempted feed as the map sees it', () => {
  const metrics = createSnapshotMetrics('abc123');
  const vehicle: FeedSnapshot['vehicles'][number] = { provider: 'voi', lat: 47.37, lng: 8.54, battery: null, range_m: null,
    vehicle_id: null, deep_link: null, distance_m: null };
  const text = metrics.render(snapshot([
    feed({ vehicles: [vehicle, vehicle] }),
    feed({ id: 'germany:dott_de_leipzig', source: 'germany', provider: 'dott', failed: true, vehicles: [vehicle],
      observedAt: now - VEHICLE_MAX_AGE_MS - 1_000 }),
    feed({ id: 'national:lime_zurich', provider: 'lime', failed: true }),
    feed({ id: 'italy:never', source: 'italy', attemptedAt: 0, observedAt: 0 }),
    feed({ id: 'national:skipped', skipped: true }),
    feed({ id: 'sweden:qick_se_orebro', source: 'sweden', provider: 'qick' }),
  ]), now);
  const voi = 'feed="national:voiscooters.com",source="national",provider="voi"';
  const leipzig = 'feed="germany:dott_de_leipzig",source="germany",provider="dott"';
  expect(sample(text, `scootradar_feed_state{${voi},state="ok"}`)).toBe('1');
  expect(sample(text, `scootradar_feed_state{${voi},state="expired"}`)).toBe('0');
  expect(sample(text, `scootradar_feed_state{${leipzig},state="expired"}`)).toBe('1');
  expect(sample(text, 'scootradar_feed_state{feed="national:lime_zurich",source="national",provider="lime",state="failing"}')).toBe('1');
  expect(sample(text, `scootradar_feed_vehicles{${voi}}`)).toBe('2');
  expect(sample(text, `scootradar_feed_priced_vehicles{${voi}}`)).toBe('0');
  // Expired positions are not served.
  expect(sample(text, `scootradar_feed_vehicles{${leipzig}}`)).toBe('0');
  expect(sample(text, `scootradar_feed_priced_vehicles{${leipzig}}`)).toBe('0');
  expect(sample(text, `scootradar_feed_observation_timestamp_seconds{${voi}}`)).toBe(String((now - 60_000) / 1000));
  expect(sample(text, `scootradar_feed_parking_up{${leipzig}}`)).toBe('0');
  // An app map collects no parking, so it has none to miss.
  expect(sample(text, 'scootradar_feed_state{feed="sweden:qick_se_orebro",source="sweden",provider="qick",state="ok"}')).toBe('1');
  expect(text).not.toContain('scootradar_feed_parking_up{feed="sweden:qick_se_orebro"');
  expect(text).not.toContain('italy:never');
  expect(text).not.toContain('national:skipped');
  expect(sample(text, 'scootradar_build_info{version="abc123"}')).toBe('1');
  expect(sample(text, 'scootradar_snapshot_updated_timestamp_seconds')).toBe(String((now - 5_000) / 1000));
});

it('says which feeds are in their seasonal pause, for the feed-stopped alert to ignore', () => {
  const asked: number[] = [];
  const metrics = createSnapshotMetrics('abc123', { paused: (id, at) => {
    asked.push(at);
    return id === 'canada:bird_montreal';
  } });
  const text = metrics.render(snapshot([feed({}), feed({ id: 'canada:bird_montreal', source: 'canada' as FeedSnapshot['source'], provider: 'bird',
    failed: true, observedAt: now - VEHICLE_MAX_AGE_MS - 1_000 })]), now);
  expect(sample(text, 'scootradar_feed_paused{feed="canada:bird_montreal",source="canada",provider="bird"}')).toBe('1');
  expect(sample(text, 'scootradar_feed_paused{feed="national:voiscooters.com",source="national",provider="voi"}')).toBe('0');
  expect(asked.every(at => at === now)).toBe(true);
  // No catalog feed pauses today.
  expect(createSnapshotMetrics().render(snapshot([feed({})]), now)).toContain(
    'scootradar_feed_paused{feed="national:voiscooters.com",source="national",provider="voi"} 0');
});

it('counts a catalog feed whose operator lists nothing as empty, but not an inactive Swiss system', () => {
  const metrics = createSnapshotMetrics('abc123', { paused: id => id === 'canada:bird_ca_ottawa' });
  const text = metrics.render(snapshot([
    feed({}),
    // Bird's town with no scooter and no time, and Dott's paused region, are skipped.
    feed({ id: 'canada:bird_ca_saskatoon', source: 'canada' as FeedSnapshot['source'], provider: 'bird', skipped: true }),
    feed({ id: 'canada:bird_ca_ottawa', source: 'canada' as FeedSnapshot['source'], provider: 'bird', skipped: true }),
    feed({ id: 'uk:beryl_gb_brighton', source: 'uk' as FeedSnapshot['source'], provider: 'beryl' }),
    // sharedmobility.ch still lists Bird in Biel, which sent its last position long ago.
    feed({ id: 'national:bird-biel', provider: 'bird', skipped: true }),
  ]), now);
  const saskatoon = 'feed="canada:bird_ca_saskatoon",source="canada",provider="bird"';
  expect(sample(text, `scootradar_feed_vehicles{${saskatoon}}`)).toBe('0');
  expect(sample(text, `scootradar_feed_paused{${saskatoon}}`)).toBe('0');
  expect(sample(text, 'scootradar_feed_paused{feed="canada:bird_ca_ottawa",source="canada",provider="bird"}')).toBe('1');
  // A skipped feed has no state.
  expect(sample(text, `scootradar_feed_state{${saskatoon},state="ok"}`)).toBeUndefined();
  expect(sample(text, `scootradar_feed_info{${saskatoon},country="Canada"}`)).toBe('1');
  expect(text).toContain('scootradar_feed_info{feed="uk:beryl_gb_brighton",source="uk",provider="beryl",country="United Kingdom"} 1\n');
  expect(sample(text, 'scootradar_feed_info{feed="national:voiscooters.com",source="national",provider="voi",country="Switzerland"}')).toBe('1');
  expect(text).not.toContain('national:bird-biel');
});

it('counts collections from zero by outcome, and requests by route and status', () => {
  const metrics = createSnapshotMetrics();
  const voi = { id: 'national:voiscooters.com', source: 'national', provider: 'voi' };
  metrics.recordCollection(voi, false, 0.25);
  metrics.recordCollection(voi, false, 0.5);
  metrics.recordRequest('/api/scooters', 200, 0.01);
  metrics.recordRequest('/api/scooters', 429, 0.002);
  metrics.recordRequest('/api/scooters', 200, 0.03);
  const text = metrics.render(undefined, now);
  const labels = 'feed="national:voiscooters.com",source="national",provider="voi"';
  expect(sample(text, `scootradar_feed_collections_total{${labels},outcome="ok"}`)).toBe('2');
  expect(sample(text, `scootradar_feed_collections_total{${labels},outcome="failed"}`)).toBe('0');
  expect(sample(text, `scootradar_feed_collection_duration_seconds_sum{${labels}}`)).toBe('0.75');
  expect(sample(text, `scootradar_feed_collection_duration_seconds_count{${labels}}`)).toBe('2');
  expect(sample(text, 'scootradar_http_requests_total{route="/api/scooters",status="200"}')).toBe('2');
  expect(sample(text, 'scootradar_http_requests_total{route="/api/scooters",status="429"}')).toBe('1');
  // From the start, for the Geoapify alert to have a series to read.
  expect(sample(text, 'scootradar_geoapify_requests_total{version="local"}')).toBe('0');
  expect(sample(text, 'scootradar_http_request_duration_seconds_count{route="/api/scooters"}')).toBe('3');
  expect(sample(text, 'scootradar_snapshot_updated_timestamp_seconds')).toBeUndefined();
});

it('counts the scooters with a price, and the plans fetched again for plans scooters named', () => {
  const vehicle: FeedSnapshot['vehicles'][number] = { provider: 'lime', lat: 47.37, lng: 8.54, battery: null, range_m: null,
    vehicle_id: null, deep_link: null, distance_m: null };
  const priced = { ...vehicle, pricing: { currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 49 } };
  const metrics = createSnapshotMetrics('abc123', { planRefreshes: () => ({ listed: 3, unlisted: 1 }) });
  const text = metrics.render(snapshot([feed({ id: 'national:lime_zurich', provider: 'lime', vehicles: [priced, vehicle, priced] })]), now);
  const lime = 'feed="national:lime_zurich",source="national",provider="lime"';
  expect(sample(text, `scootradar_feed_vehicles{${lime}}`)).toBe('3');
  expect(sample(text, `scootradar_feed_priced_vehicles{${lime}}`)).toBe('2');
  expect(sample(text, 'scootradar_pricing_plan_refreshes_total{outcome="listed"}')).toBe('3');
  expect(sample(text, 'scootradar_pricing_plan_refreshes_total{outcome="unlisted"}')).toBe('1');
});

it('escapes label values', () => {
  const text = createSnapshotMetrics('a"b\\c\nd').render(undefined, now);
  expect(text).toContain('scootradar_build_info{version="a\\"b\\\\c\\nd"} 1');
});

it('stops counting a feed retired from the catalog', () => {
  const metrics = createSnapshotMetrics();
  metrics.recordCollection({ id: 'national:retired', source: 'national', provider: 'voi' }, true, 1);
  metrics.recordCollection({ id: 'national:voiscooters.com', source: 'national', provider: 'voi' }, false, 1);
  const text = metrics.render(snapshot([feed({})]), now);
  expect(text).toContain('feed="national:voiscooters.com"');
  expect(text).not.toContain('national:retired');
});

it('judges feeds by their cadence and shows what the cadence costs', () => {
  const requests = { status: 12, metadata: 3 };
  const metrics = createSnapshotMetrics('abc123', {
    cadence: { fastSince: id => id.startsWith('national:') ? 0 : undefined, idleExpiryMs: 30 * 60_000 },
    cadenceModes: () => ({ always: 20, watched: 2, idle: 150 }),
    upstreamRequests: () => requests,
    upstreamCache: () => ({ entries: 1_900, capacity: 2_322, evictions: 4 }),
  });
  metrics.recordCollectionStart('idle');
  metrics.recordCollectionStart('wake');
  metrics.recordCollectionStart('idle');
  metrics.recordWait(true);
  const lyon = 'feed="france:dott_fr_lyon",source="france",provider="dott"';
  const text = metrics.render(snapshot([
    // Idle, collected 12 minutes ago with positions 9 minutes old then.
    feed({ id: 'france:dott_fr_lyon', source: 'france', provider: 'dott', observedAt: now - 21 * 60_000,
      attemptedAt: now - 12 * 60_000, collectedAt: now - 12 * 60_000,
      parking: { locations: [], observedAt: now - 12 * 60_000, stale: false } }),
    feed({ observedAt: now - VEHICLE_MAX_AGE_MS - 1_000, collectedAt: now - 60_000 }),
  ]), now);
  expect(sample(text, `scootradar_feed_state{${lyon},state="ok"}`)).toBe('1');
  expect(sample(text, `scootradar_feed_parking_up{${lyon}}`)).toBe('1');
  expect(sample(text, 'scootradar_feed_state{feed="national:voiscooters.com",source="national",provider="voi",state="expired"}')).toBe('1');
  expect(sample(text, 'scootradar_feeds_by_cadence{cadence="idle"}')).toBe('150');
  expect(sample(text, 'scootradar_collections_started_total{reason="idle"}')).toBe('2');
  expect(sample(text, 'scootradar_collections_started_total{reason="wake"}')).toBe('1');
  expect(sample(text, 'scootradar_request_waits_total{outcome="collected"}')).toBe('1');
  expect(sample(text, 'scootradar_request_waits_total{outcome="timeout"}')).toBe('0');
  expect(sample(text, 'scootradar_upstream_requests_total{kind="status"}')).toBe('12');
  expect(sample(text, 'scootradar_upstream_cache_entries{kind="used"}')).toBe('1900');
  expect(sample(text, 'scootradar_upstream_cache_entries{kind="capacity"}')).toBe('2322');
  expect(sample(text, 'scootradar_upstream_cache_evictions_total')).toBe('4');
});

it('says which feeds are under a night ban, for the feed-stopped alert to wait', () => {
  const metrics = createSnapshotMetrics('abc123', { curfewed: id => id === 'norway:dott_no_trondheim' });
  const text = metrics.render(snapshot([feed({}), feed({ id: 'norway:dott_no_trondheim', source: 'norway' as FeedSnapshot['source'],
    provider: 'dott', failed: true, observedAt: now - VEHICLE_MAX_AGE_MS - 1_000 })]), now);
  expect(sample(text, 'scootradar_feed_curfewed{feed="norway:dott_no_trondheim",source="norway",provider="dott"}')).toBe('1');
  expect(sample(text, 'scootradar_feed_curfewed{feed="national:voiscooters.com",source="national",provider="voi"}')).toBe('0');
  // Switzerland bans no night.
  expect(createSnapshotMetrics().render(snapshot([feed({})]), now)).toContain(
    'scootradar_feed_curfewed{feed="national:voiscooters.com",source="national",provider="voi"} 0');
});
