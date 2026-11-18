import { describe, expect, it } from 'vitest';
import { localClock } from '../src/lib/rentalCurfews';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, regionalSource } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { APP_MAP_IDLE_GRACE_MS, APP_MAP_IDLE_INTERVAL_MS, daytimeSweeps, townTimeZone, withDailySweeps } from './appMapCadence';
import { withLuupAppCollectors } from './luupApp';

const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;
// 12:00 UTC on Wednesday 18 November 2026.
const NOON = Date.UTC(2026, 10, 18, 12);
const feedOf = (system: (typeof REGIONAL_SCOOTER_SYSTEMS)[number]) =>
  ({ id: `${regionalSource(system)}:${system.id}`, host: 'example.test' }) as CollectableScooterFeed;
const appMaps = REGIONAL_SCOOTER_SYSTEMS.filter(isAppMapSystem);
/** The town's clock at the feed's turn that day, in minutes. */
const turnAt = (feed: CollectableScooterFeed, timeZone: string) => localClock(NOON - NOON % DAY + feed.idlePhase! * DAY, timeZone).minutes;

describe('the app maps nobody looks at', () => {
  it('are collected once a day, between 08:00 and 21:00 in their town, and expire two hours after their day', () => {
    // Those whose collector sets no interval: every operator's but Lime's, Bird's and Ryde's.
    const own = appMaps.filter(system => !system.limeAppMap && !system.birdAppArea && !system.rydeAppArea);
    expect(new Set(own.map(system => system.provider))).toEqual(new Set(['dott', 'bolt', 'voi', 'gcoo', 'swing', 'deer', 'jet', 'beam',
      'xingxing', 'kickgoing', 'alpaca', 'whoosh', 'luup', 'binbin', 'qick', 'move', 'zippy', 'ridemovi', 'ryde', 'dart']));
    const feeds = withDailySweeps(own.map(feedOf), REGIONAL_SCOOTER_SYSTEMS, NOON);
    for (const [index, feed] of feeds.entries()) {
      const timeZone = townTimeZone(own[index])!;
      expect(feed, feed.id).toMatchObject({ idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, idleGraceMs: APP_MAP_IDLE_GRACE_MS });
      expect(turnAt(feed, timeZone), feed.id).toBeGreaterThanOrEqual(8 * 60);
      expect(turnAt(feed, timeZone), feed.id).toBeLessThan(21 * 60);
    }
    expect(APP_MAP_IDLE_INTERVAL_MS).toBe(DAY);
    expect(APP_MAP_IDLE_GRACE_MS).toBe(2 * HOUR);
    // Their turns are spread over the day, not all at one hour.
    expect(new Set(feeds.map(feed => Math.floor(feed.idlePhase! * 24))).size).toBeGreaterThan(20);
  });

  it("names a time zone for every app map's town, its country's where the catalog gives none", () => {
    expect(appMaps.filter(system => !townTimeZone(system)).map(system => system.id)).toEqual([]);
    const bonn = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'dott_de_bonn')!;
    expect(bonn.timeZone).toBeUndefined();
    expect(townTimeZone(bonn)).toBe('Europe/Berlin');
    expect(townTimeZone({ country: 'KR', timeZone: 'Asia/Seoul' })).toBe('Asia/Seoul');
  });

  it('are collected again at 08:00 after a collection by night, when an operator may hide its scooters', () => {
    const bonn = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'dott_de_bonn')!;
    const [feed] = withDailySweeps([feedOf(bonn)], REGIONAL_SCOOTER_SYSTEMS, NOON);
    // 02:00 in Bonn, an hour ahead of UTC in November: the night ends at 08:00 there, 07:00 UTC.
    expect(feed.nightEnds!(Date.UTC(2026, 10, 18, 1))).toBe(Date.UTC(2026, 10, 18, 7));
    expect(feed.nightEnds!(NOON)).toBeUndefined();
  });

  it("leaves a collector's own interval, as Lime's three days, and the open feeds, every 20 minutes", () => {
    const lime = feedOf(appMaps.find(system => system.limeAppMap)!);
    const swept = { ...lime, idleIntervalMs: 3 * DAY, idlePhase: 0.25 };
    const open = feedOf(REGIONAL_SCOOTER_SYSTEMS.find(system => !isAppMapSystem(system))!);
    const feeds = withDailySweeps([swept, open], REGIONAL_SCOOTER_SYSTEMS, NOON);
    expect(feeds[0]).toBe(swept);
    expect(feeds[1]).toBe(open);
  });

  it('keeps one turn for the towns their collector reads together', () => {
    const ids = ['luup_jp_shibuya', 'luup_jp_kawasaki', 'luup_jp_yokohama'];
    const bare = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.luupAppCities).map(feedOf);
    const feeds = withDailySweeps(withLuupAppCollectors(bare, REGIONAL_SCOOTER_SYSTEMS), REGIONAL_SCOOTER_SYSTEMS, NOON);
    const together = feeds.filter(feed => ids.some(id => feed.id.endsWith(`:${id}`)));
    expect(together).toHaveLength(3);
    expect(new Set(together.map(feed => feed.idlePhase)).size).toBe(1);
    expect(turnAt(together[0], 'Asia/Tokyo')).toBeGreaterThanOrEqual(8 * 60);
    expect(turnAt(together[0], 'Asia/Tokyo')).toBeLessThan(21 * 60);
    // The other towns each have their own.
    expect(new Set(feeds.map(feed => feed.idlePhase)).size).toBe(feeds.length - 2);
  });

  it('puts a turn given as a share of the day where an id of that share would fall', () => {
    // 03:00 UTC is noon in Seoul; 15:00 UTC is midnight there, moved twelve hours on.
    expect(daytimeSweeps(3 / 24, 'Asia/Seoul', DAY, NOON).idlePhase).toBeCloseTo(3 / 24);
    expect(daytimeSweeps(15 / 24, 'Asia/Seoul', DAY, NOON).idlePhase).toBeCloseTo(3 / 24);
  });
});
