import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { feedPaused } from '../src/lib/seasonalPauses';
import { heldPauses, pauseHolds, seasonalPaused } from './seasonal-pauses.mjs';

const countries = JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url), 'utf8')).countries
  .filter(country => country.catalog);
const systems = countries.flatMap(country => JSON.parse(readFileSync(new URL(`../${country.catalog}`, import.meta.url), 'utf8'))
  .systems.map(system => ({ ...system, country: country.code })));
const DAY = 86_400_000;

describe('the live catalog check\'s seasonal pauses', () => {
  const edmonton = { from: '10-22', until: '05-01', timeZone: 'America/Edmonton' };

  it('holds a window across the new year from its first day until the day the scooters are back, local time', () => {
    expect(pauseHolds(edmonton, Date.parse('2026-10-22T05:59:00Z'))).toBe(false); // 23:59 on the 21st in Edmonton
    expect(pauseHolds(edmonton, Date.parse('2026-10-22T06:00:00Z'))).toBe(true);
    expect(pauseHolds(edmonton, Date.parse('2027-01-15T12:00:00Z'))).toBe(true);
    expect(pauseHolds(edmonton, Date.parse('2027-05-01T06:00:00Z'))).toBe(false);
  });

  it('holds a pause until the streets are clear until 1 May', () => {
    const skien = { from: '12-15', until: 'clear', timeZone: 'Europe/Oslo' };
    expect(pauseHolds(skien, Date.parse('2027-04-30T12:00:00Z'))).toBe(true);
    expect(pauseHolds(skien, Date.parse('2027-05-01T12:00:00Z'))).toBe(false);
  });

  it('pauses a system only while every one of its service areas is paused', () => {
    const now = Date.parse('2027-01-15T12:00:00Z');
    expect(heldPauses({ seasonal: edmonton }, now)).toEqual([edmonton]);
    expect(heldPauses({ seasonal: edmonton, areas: [{}, {}] }, now)).toEqual([edmonton, edmonton]);
    expect(heldPauses({ areas: [{ seasonal: edmonton }, {}] }, now)).toBeUndefined();
    expect(heldPauses({}, now)).toBeUndefined();
    expect(heldPauses({ seasonal: edmonton }, Date.parse('2027-07-01T12:00:00Z'))).toBeUndefined();
  });

  it('pauses a feed that is gone in its window, as Dott\'s Trondheim, which left Entur on 13 November 2026', () => {
    // The weekly check of 16 November 2026, 13:57 UTC, failed on this answer, in the window from 14 November.
    const trondheim = systems.find(system => system.id === 'dott_no_trondheim');
    const gone = { system: 'dott_no_trondheim', state: 'gone', error: 'HTTP 404 at /mobility/v2/gbfs/v3/dotttrondheim/gbfs' };
    const inWindow = Date.parse('2026-11-16T13:57:00Z');
    expect(seasonalPaused(trondheim, gone, inWindow))
      .toEqual({ ...gone, state: 'paused', error: 'Seasonal pause until 03-15: HTTP 404 at /mobility/v2/gbfs/v3/dotttrondheim/gbfs' });
    expect(seasonalPaused(trondheim, { ...gone, state: 'failed', error: 'Missing vehicle array' }, inWindow))
      .toMatchObject({ state: 'paused', error: 'Seasonal pause until 03-15: Missing vehicle array' });
    expect(seasonalPaused(trondheim, { system: 'dott_no_trondheim', state: 'ok' }, inWindow)).toEqual({ system: 'dott_no_trondheim', state: 'ok' });
    // Once the window ends, a feed still gone is reported, as the cache's alerts report it again.
    expect(seasonalPaused(trondheim, gone, Date.parse('2027-03-15T12:00:00Z'))).toEqual(gone);
    // And a feed with no window is gone whenever it is.
    const oslo = systems.find(system => system.id === 'voi_no_oslo');
    expect(oslo?.seasonal).toBeUndefined();
    expect(seasonalPaused(oslo, { ...gone, system: 'voi_no_oslo' }, inWindow)).toMatchObject({ state: 'gone' });
  });

  it('answers as the map and the cache\'s alerts do, for every seasonal catalog entry through a year', () => {
    const seasonal = systems.filter(system => system.seasonal || system.areas?.some(area => area.seasonal));
    expect(seasonal.map(system => system.id)).toContain('bird_ca_leduc');
    const byFeed = new Map(seasonal.map(system => [`${system.country}:${system.id}`, system]));
    for (let day = Date.parse('2026-12-31T00:00:00Z'); day < Date.parse('2028-01-01T00:00:00Z'); day += DAY) {
      for (const hour of [0, 6, 12, 18]) {
        const now = day + hour * 3_600_000;
        for (const system of seasonal) {
          expect(!!heldPauses(system, now), `${system.id} at ${new Date(now).toISOString()}`).toBe(feedPaused(`${system.country}:${system.id}`, now, byFeed));
        }
      }
    }
  });
});
