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
  ]), now);
  const voi = 'feed="national:voiscooters.com",source="national",provider="voi"';
  const leipzig = 'feed="germany:dott_de_leipzig",source="germany",provider="dott"';
  expect(sample(text, `scootradar_feed_state{${voi},state="ok"}`)).toBe('1');
  expect(sample(text, `scootradar_feed_state{${voi},state="expired"}`)).toBe('0');
  expect(sample(text, `scootradar_feed_state{${leipzig},state="expired"}`)).toBe('1');
  expect(sample(text, 'scootradar_feed_state{feed="national:lime_zurich",source="national",provider="lime",state="failing"}')).toBe('1');
  expect(sample(text, `scootradar_feed_vehicles{${voi}}`)).toBe('2');
  // Expired positions are not served.
  expect(sample(text, `scootradar_feed_vehicles{${leipzig}}`)).toBe('0');
  expect(sample(text, `scootradar_feed_observation_timestamp_seconds{${voi}}`)).toBe(String((now - 60_000) / 1000));
  expect(sample(text, `scootradar_feed_parking_up{${leipzig}}`)).toBe('0');
  expect(text).not.toContain('italy:never');
  expect(text).not.toContain('national:skipped');
  expect(sample(text, 'scootradar_build_info{version="abc123"}')).toBe('1');
  expect(sample(text, 'scootradar_snapshot_updated_timestamp_seconds')).toBe(String((now - 5_000) / 1000));
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
  expect(sample(text, 'scootradar_http_request_duration_seconds_count{route="/api/scooters"}')).toBe('3');
  expect(sample(text, 'scootradar_snapshot_updated_timestamp_seconds')).toBeUndefined();
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
