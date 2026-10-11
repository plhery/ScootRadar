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
    feed({ id: 'germany:dott_de_kiel', source: 'germany', provider: 'dott', failed: true, vehicles: [vehicle],
      observedAt: now - VEHICLE_MAX_AGE_MS - 1_000 }),
    feed({ id: 'national:lime_zurich', provider: 'lime', failed: true }),
    feed({ id: 'italy:never', source: 'italy', attemptedAt: 0, observedAt: 0 }),
    feed({ id: 'national:skipped', skipped: true }),
  ]), now);
  const voi = 'feed="national:voiscooters.com",source="national",provider="voi"';
  const kiel = 'feed="germany:dott_de_kiel",source="germany",provider="dott"';
  expect(sample(text, `scootradar_feed_state{${voi},state="ok"}`)).toBe('1');
  expect(sample(text, `scootradar_feed_state{${voi},state="expired"}`)).toBe('0');
  expect(sample(text, `scootradar_feed_state{${kiel},state="expired"}`)).toBe('1');
  expect(sample(text, 'scootradar_feed_state{feed="national:lime_zurich",source="national",provider="lime",state="failing"}')).toBe('1');
  expect(sample(text, `scootradar_feed_vehicles{${voi}}`)).toBe('2');
  // Expired positions are not served.
  expect(sample(text, `scootradar_feed_vehicles{${kiel}}`)).toBe('0');
  expect(sample(text, `scootradar_feed_observation_timestamp_seconds{${voi}}`)).toBe(String((now - 60_000) / 1000));
  expect(sample(text, `scootradar_feed_parking_up{${kiel}}`)).toBe('0');
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
