import { expect, it } from 'vitest';
import { createFeedStateLog } from './feedStateLog';
import { VEHICLE_MAX_AGE_MS, type FeedSnapshot } from '../src/lib/scooterSnapshots';

const feed = (changes: Partial<FeedSnapshot>): FeedSnapshot => ({ id: 'national:voiscooters.com', source: 'national',
  provider: 'voi', coverage: [], vehicles: [], observedAt: 0, attemptedAt: 0, stale: false, failed: false, skipped: false,
  ...changes });

it('logs a feed that expires between two collections without an error, and its return', () => {
  const lines: string[] = [];
  const logStates = createFeedStateLog(line => lines.push(line));
  const collectedAt = 1_000_000_000;
  // Collected with a source timestamp half a minute short of the age limit.
  const lagging = feed({ observedAt: collectedAt - VEHICLE_MAX_AGE_MS + 30_000, attemptedAt: collectedAt });
  logStates([lagging], collectedAt);
  logStates([lagging], collectedAt + 25_000);
  expect(lines).toEqual([]);
  logStates([lagging], collectedAt + 35_000);
  logStates([lagging], collectedAt + 40_000);
  logStates([feed({ observedAt: collectedAt + 50_000, attemptedAt: collectedAt + 60_000 })], collectedAt + 60_000);
  expect(lines.map(line => JSON.parse(line))).toEqual([
    { event: 'snapshot_feed_state', feed: 'national:voiscooters.com', state: 'expired', previous: 'ok',
      secondsInPrevious: 35, observationAgeSeconds: VEHICLE_MAX_AGE_MS / 1000 + 5, attemptAgeSeconds: 35 },
    { event: 'snapshot_feed_state', feed: 'national:voiscooters.com', state: 'ok', previous: 'expired',
      secondsInPrevious: 25, observationAgeSeconds: 10, attemptAgeSeconds: 0 },
  ]);
});

it('stays quiet about feeds that keep their state, were never attempted or are skipped', () => {
  const lines: string[] = [];
  const logStates = createFeedStateLog(line => lines.push(line));
  const now = 1_000_000_000;
  const feeds = [
    feed({ id: 'germany:dott_de_kiel', failed: true, attemptedAt: now - 30_000 }),
    feed({ id: 'national:lime_zurich', observedAt: now - 60_000, attemptedAt: now - 30_000 }),
    feed({ id: 'national:placeholder', observedAt: now - VEHICLE_MAX_AGE_MS }),
    feed({ id: 'italy:skipped', skipped: true, attemptedAt: now }),
  ];
  for (let minute = 0; minute < 5; minute++) logStates(feeds, now + minute * 60_000);
  expect(lines).toEqual([]);
});

it('logs a failed collection while the previous positions are still served', () => {
  const lines: string[] = [];
  const logStates = createFeedStateLog(line => lines.push(line));
  const now = 1_000_000_000;
  logStates([feed({ observedAt: now - 20_000, attemptedAt: now - 10_000 })], now);
  logStates([feed({ observedAt: now - 20_000, attemptedAt: now + 50_000, failed: true })], now + 50_000);
  expect(JSON.parse(lines[0])).toMatchObject({ state: 'failing', previous: 'ok', observationAgeSeconds: 70 });
});

it('passes each change and its feed on', () => {
  const changes: unknown[] = [];
  const logStates = createFeedStateLog(() => {}, (change, changed) => changes.push([change.state, change.previous, changed.provider]));
  const now = 1_000_000_000;
  logStates([feed({ observedAt: now - 20_000, attemptedAt: now - 10_000 })], now);
  logStates([feed({ observedAt: now - 20_000, attemptedAt: now - 10_000 })], now + VEHICLE_MAX_AGE_MS);
  expect(changes).toEqual([['expired', 'ok', 'voi']]);
});
