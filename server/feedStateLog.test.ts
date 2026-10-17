import { describe, expect, it } from 'vitest';
import { ALWAYS_FAST, createFeedStateLog, feedState, parkingUp, waitOutCurfew, type FeedCadence } from './feedStateLog';
import { feedCurfewed } from '../src/lib/seasonalPauses';
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
    feed({ id: 'germany:dott_de_leipzig', failed: true, attemptedAt: now - 30_000 }),
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

it('tells of a feed still expired after a while, once for each time it expires, and not of a blip', () => {
  const reported: [string, number][] = [];
  const minutes = (count: number) => count * 60_000;
  const logStates = createFeedStateLog(() => {}, undefined, ALWAYS_FAST,
    { afterMs: minutes(5), report: (change, current) => reported.push([change.previous, current.attemptedAt]) });
  const now = 1_000_000_000;
  const late = (at: number, attemptedAt = at) => [feed({ observedAt: at - VEHICLE_MAX_AGE_MS - 1_000, attemptedAt })];
  logStates([feed({ observedAt: now, attemptedAt: now })], now);
  // Expired for 105 seconds, as Voi on 16 October 2026, then back.
  logStates(late(now + minutes(15)), now + minutes(15));
  logStates(late(now + minutes(16)), now + minutes(16) + 45_000);
  logStates([feed({ observedAt: now + minutes(17), attemptedAt: now + minutes(17) })], now + minutes(17));
  expect(reported).toEqual([]);
  // Expired again, and still after five minutes: told once, with the feed as it is then.
  const expiredAt = now + minutes(32);
  logStates(late(expiredAt), expiredAt);
  logStates(late(expiredAt, expiredAt + minutes(4)), expiredAt + minutes(4));
  logStates(late(expiredAt, expiredAt + minutes(5)), expiredAt + minutes(5));
  logStates(late(expiredAt, expiredAt + minutes(9)), expiredAt + minutes(9));
  expect(reported).toEqual([['ok', expiredAt + minutes(5)]]);
});

it('holds the report while told to wait, and tells once if the feed is still expired after', () => {
  const reported: number[] = [];
  const minutes = (count: number) => count * 60_000;
  const now = 1_000_000_000;
  // As Dott in Trondheim under the night ban: down at 23:00, back at 05:00.
  let banned = true;
  const logStates = createFeedStateLog(() => {}, undefined, ALWAYS_FAST, { afterMs: minutes(5),
    wait: () => banned, report: (_change, current) => { reported.push(current.attemptedAt); } });
  const late = (at: number) => [feed({ observedAt: now, attemptedAt: at })];
  logStates(late(now), now);
  for (let minute = 16; minute < 6 * 60; minute += 10) logStates(late(now + minutes(minute)), now + minutes(minute));
  logStates([feed({ observedAt: now + minutes(361), attemptedAt: now + minutes(361) })], now + minutes(361));
  banned = false;
  logStates([feed({ observedAt: now + minutes(362), attemptedAt: now + minutes(362) })], now + minutes(370));
  expect(reported).toEqual([]);

  // Not back after the ban: told once, when it may.
  const expiredAt = now + minutes(400);
  banned = true;
  logStates(late(expiredAt), expiredAt);
  logStates(late(expiredAt + minutes(30)), expiredAt + minutes(30));
  banned = false;
  logStates(late(expiredAt + minutes(31)), expiredAt + minutes(31));
  logStates(late(expiredAt + minutes(32)), expiredAt + minutes(32));
  expect(reported).toEqual([expiredAt + minutes(31)]);
});

it('waits 15 minutes after Trondheim\'s night ban for Dott\'s feed, which came back 7.5 minutes after it', () => {
  const reported: number[] = [];
  const minutes = (count: number) => count * 60_000;
  const logStates = createFeedStateLog(() => {}, undefined, ALWAYS_FAST, { afterMs: minutes(5),
    wait: waitOutCurfew(feedCurfewed), report: (_change, current) => { reported.push(current.attemptedAt); } });
  const dott = (observedAt: number, attemptedAt: number) =>
    [feed({ id: 'norway:dott_no_trondheim', provider: 'dott', observedAt, attemptedAt })];
  // Saturday 17 October 2026: the ban ends at 05:00 in Trondheim, 03:00 UTC.
  const banEnd = Date.parse('2026-10-17T03:00:00Z');
  const down = banEnd - minutes(6 * 60);
  logStates(dott(down, down), down);
  for (let at = down + minutes(20); at < banEnd + minutes(7); at += minutes(1)) logStates(dott(down, at), at);
  logStates(dott(banEnd + minutes(7.5), banEnd + minutes(7.5)), banEnd + minutes(7.5));
  expect(reported).toEqual([]);

  // Sunday morning, not back: told 15 minutes after the ban, not before.
  const sundayEnd = Date.parse('2026-10-18T03:00:00Z');
  const downAgain = sundayEnd - minutes(6 * 60);
  logStates(dott(downAgain, downAgain), downAgain);
  for (let at = downAgain + minutes(20); at <= sundayEnd + minutes(20); at += minutes(1)) logStates(dott(downAgain, at), at);
  expect(reported).toEqual([sundayEnd + minutes(15)]);
});

describe('cadence', () => {
  const now = 1_000_000_000;
  const minutes = (count: number) => count * 60_000;
  const idle: FeedCadence = { fastSince: () => undefined, idleExpiryMs: minutes(30) };
  const watchedSince = (since: number): FeedCadence => ({ fastSince: () => since, idleExpiryMs: minutes(30) });

  it('keeps an idle feed ok while its collections are on time, however old its positions', () => {
    // Collected 19 minutes ago, with positions already 9 minutes old then.
    const quiet = feed({ observedAt: now - minutes(28), attemptedAt: now - minutes(19), collectedAt: now - minutes(19) });
    expect(feedState(quiet, now, idle)).toBe('ok');
    expect(feedState(quiet, now)).toBe('expired');
    // No successful collection for over half an hour.
    expect(feedState({ ...quiet, failed: true, attemptedAt: now - minutes(1) }, now + minutes(12), idle)).toBe('expired');
    expect(feedState({ ...quiet, failed: true, attemptedAt: now - minutes(1) }, now, idle)).toBe('failing');
    // Saved before collectedAt existed: its positions' time stands in.
    expect(feedState(feed({ observedAt: now - minutes(31), attemptedAt: now - minutes(1) }), now, idle)).toBe('expired');
  });

  it('judges a feed by its positions once it has been watched for 15 minutes', () => {
    const old = feed({ observedAt: now - minutes(16), attemptedAt: now - minutes(1), collectedAt: now - minutes(1) });
    // Just watched: its collection is under way.
    expect(feedState(old, now, watchedSince(now - minutes(1)))).toBe('ok');
    expect(feedState(old, now, watchedSince(now - minutes(15)))).toBe('expired');
  });

  it('judges parking as its cadence allows', () => {
    const parked = feed({ id: 'france:dott_fr_lyon', source: 'france', parking: { locations: [], observedAt: now - minutes(12), stale: false } });
    expect(parkingUp(parked, now, idle)).toBe(true);
    expect(parkingUp(parked, now)).toBe(false);
    expect(parkingUp(parked, now, watchedSince(now - minutes(2)))).toBe(true);
    expect(parkingUp({ ...parked, parking: { ...parked.parking!, observedAt: now - minutes(31) } }, now, idle)).toBe(false);
    expect(parkingUp({ ...parked, parking: { ...parked.parking!, stale: true } }, now, idle)).toBe(false);
  });

  it('logs no expiry for an idle feed whose positions age between collections', () => {
    const lines: string[] = [];
    const logStates = createFeedStateLog(line => lines.push(line), undefined, idle);
    for (let minute = 0; minute <= 60; minute++) {
      const collected = now + Math.floor(minute / 20) * minutes(20);
      logStates([feed({ observedAt: collected - minutes(9), attemptedAt: collected, collectedAt: collected })], now + minutes(minute));
    }
    expect(lines).toEqual([]);
  });
});
