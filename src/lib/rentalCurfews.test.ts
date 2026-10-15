import { describe, expect, it } from 'vitest';
import { activeCurfew, polygonContainsPoint } from './rentalCurfews';

const OSLO: [number, number] = [59.9139, 10.7522];
const SANDVIKA: [number, number] = [59.8913, 10.5236];
const TRONDHEIM: [number, number] = [63.4305, 10.3951];
const STAVANGER: [number, number] = [58.97, 5.7331];
const TONSBERG: [number, number] = [59.2675, 10.4076];
const TROMSO: [number, number] = [69.6492, 18.9553];
const BRIGHTON: [number, number] = [50.8225, -0.1372];
const POOLE: [number, number] = [50.715, -1.9872];
const MATOSINHOS: [number, number] = [41.1844, -8.6963];
const PORTO: [number, number] = [41.1496, -8.611];
const KYIV: [number, number] = [50.4501, 30.5234];
const OBOLON: [number, number] = [50.5014, 30.4983];
const BROVARY: [number, number] = [50.5113, 30.7903];
const DALLAS: [number, number] = [32.7767, -96.797];
const ATLANTA: [number, number] = [33.749, -84.388];
const NASHVILLE: [number, number] = [36.1627, -86.7816];
const BRENTWOOD: [number, number] = [36.0331, -86.7828];
const LINCOLN: [number, number] = [40.8136, -96.7026];
const CHICAGO: [number, number] = [41.8781, -87.6298];
const MINNEAPOLIS: [number, number] = [44.9778, -93.265];
const ST_PAUL: [number, number] = [44.9537, -93.09];
const NC_STATE: [number, number] = [35.7847, -78.6821];
const BIRMINGHAM_AL: [number, number] = [33.5186, -86.8104];
const at = (iso: string) => Date.parse(iso);

describe('activeCurfew', () => {
  it('holds in Oslo from 23:00 to 05:00, Oslo time', () => {
    // 22:59 and 23:00 in Oslo, summer time.
    expect(activeCurfew(OSLO, at('2026-10-12T20:59:00Z'))).toBeNull();
    expect(activeCurfew(OSLO, at('2026-10-12T21:00:00Z'))).toEqual({ city: 'Oslo', until: at('2026-10-13T03:00:00Z'), timeZone: 'Europe/Oslo' });
    expect(activeCurfew(OSLO, at('2026-10-13T02:59:30Z'))).toEqual({ city: 'Oslo', until: at('2026-10-13T03:00:00Z'), timeZone: 'Europe/Oslo' });
    expect(activeCurfew(OSLO, at('2026-10-13T03:00:00Z'))).toBeNull();
  });

  it('ends at 05:00 on the nights the clocks change', () => {
    // Back from 03:00 to 02:00 on 25 October 2026: the night has seven hours.
    expect(activeCurfew(OSLO, at('2026-10-24T21:30:00Z'))?.until).toBe(at('2026-10-25T04:00:00Z'));
    // Forward from 02:00 to 03:00 on 28 March 2027: five.
    expect(activeCurfew(OSLO, at('2027-03-27T22:30:00Z'))?.until).toBe(at('2027-03-28T03:00:00Z'));
  });

  it('holds in Trondheim on Friday and Saturday nights only', () => {
    // Monday 12 October 2026, 23:30 in Trondheim.
    expect(activeCurfew(TRONDHEIM, at('2026-10-12T21:30:00Z'))).toBeNull();
    // Friday 23:30, then Saturday 04:00 and Sunday 00:30.
    expect(activeCurfew(TRONDHEIM, at('2026-10-16T21:30:00Z'))).toEqual({ city: 'Trondheim', until: at('2026-10-17T03:00:00Z'), timeZone: 'Europe/Oslo' });
    expect(activeCurfew(TRONDHEIM, at('2026-10-17T02:00:00Z'))?.until).toBe(at('2026-10-17T03:00:00Z'));
    expect(activeCurfew(TRONDHEIM, at('2026-10-17T22:30:00Z'))?.until).toBe(at('2026-10-18T03:00:00Z'));
    // Sunday 23:30.
    expect(activeCurfew(TRONDHEIM, at('2026-10-18T21:30:00Z'))).toBeNull();
  });

  it('reads a night that starts at midnight as the early hours after the evening', () => {
    // Stavanger bans 00:00–05:00 after Friday and Saturday: not at Friday 23:30, but at Saturday 00:30.
    expect(activeCurfew(STAVANGER, at('2026-10-16T21:30:00Z'))).toBeNull();
    expect(activeCurfew(STAVANGER, at('2026-10-16T22:30:00Z'))).toEqual({ city: 'Stavanger', until: at('2026-10-17T03:00:00Z'), timeZone: 'Europe/Oslo' });
    // Not after Thursday.
    expect(activeCurfew(STAVANGER, at('2026-10-15T22:30:00Z'))).toBeNull();
  });

  it('takes the window of the night it is when a city has several', () => {
    // Tønsberg: 23:00–05:00 after Friday and Saturday, 01:00–05:00 after the other evenings.
    expect(activeCurfew(TONSBERG, at('2026-10-13T21:30:00Z'))).toBeNull();
    expect(activeCurfew(TONSBERG, at('2026-10-13T23:30:00Z'))).toEqual({ city: 'Tønsberg', until: at('2026-10-14T03:00:00Z'), timeZone: 'Europe/Oslo' });
    expect(activeCurfew(TONSBERG, at('2026-10-16T21:30:00Z'))?.until).toBe(at('2026-10-17T03:00:00Z'));
  });

  it('finds a city on an island of its municipality', () => {
    // Tromsø's centre is on Tromsøya; its ban runs to 06:00 after Friday and Saturday.
    expect(activeCurfew(TROMSO, at('2026-10-16T21:30:00Z'))).toEqual({ city: 'Tromsø', until: at('2026-10-17T04:00:00Z'), timeZone: 'Europe/Oslo' });
  });

  it('reads British bans in London time', () => {
    // 00:30 in Brighton, summer time; Poole closes from 22:00.
    expect(activeCurfew(BRIGHTON, at('2026-10-12T23:30:00Z'))).toEqual({ city: 'Brighton', until: at('2026-10-13T04:00:00Z'), timeZone: 'Europe/London' });
    expect(activeCurfew(BRIGHTON, at('2026-10-12T22:30:00Z'))).toBeNull();
    expect(activeCurfew(POOLE, at('2026-10-12T21:30:00Z'))).toEqual({ city: 'Poole', until: at('2026-10-13T04:00:00Z'), timeZone: 'Europe/London' });
  });

  it('reads Matosinhos in Lisbon time, and stops at Porto', () => {
    // 22:00 in Matosinhos, summer time, until 06:00; Porto lets scooters rent all night.
    expect(activeCurfew(MATOSINHOS, at('2026-10-12T20:59:00Z'))).toBeNull();
    expect(activeCurfew(MATOSINHOS, at('2026-10-12T21:00:00Z'))).toEqual({ city: 'Matosinhos', until: at('2026-10-13T05:00:00Z'), timeZone: 'Europe/Lisbon' });
    expect(activeCurfew(PORTO, at('2026-10-12T23:00:00Z'))).toBeNull();
  });

  it('reads Kyiv\'s martial-law curfew in Kyiv time, across the city and not beyond it', () => {
    // 01:00 in Kyiv, summer time, until 05:00.
    expect(activeCurfew(KYIV, at('2026-10-14T21:59:00Z'))).toBeNull();
    expect(activeCurfew(KYIV, at('2026-10-14T22:00:00Z'))).toEqual({ city: 'Kyiv', until: at('2026-10-15T02:00:00Z'), timeZone: 'Europe/Kyiv' });
    expect(activeCurfew(OBOLON, at('2026-10-15T01:59:00Z'))?.until).toBe(at('2026-10-15T02:00:00Z'));
    expect(activeCurfew(KYIV, at('2026-10-15T02:00:00Z'))).toBeNull();
    // 01:30 in winter time.
    expect(activeCurfew(KYIV, at('2026-11-09T23:30:00Z'))).toEqual({ city: 'Kyiv', until: at('2026-11-10T03:00:00Z'), timeZone: 'Europe/Kyiv' });
    expect(activeCurfew(BROVARY, at('2026-10-14T23:00:00Z'))).toBeNull();
  });

  it('reads American bans by each city\'s clock, and stops at its line', () => {
    // Dallas lets rides start until 20:45, Central time, and opens again at 05:00.
    expect(activeCurfew(DALLAS, at('2026-10-15T01:44:00Z'))).toBeNull();
    expect(activeCurfew(DALLAS, at('2026-10-15T01:45:00Z'))).toEqual({ city: 'Dallas', until: at('2026-10-15T10:00:00Z'), timeZone: 'America/Chicago' });
    // Atlanta bans only 02:00 to 04:00, Eastern time.
    expect(activeCurfew(ATLANTA, at('2026-10-15T05:59:00Z'))).toBeNull();
    expect(activeCurfew(ATLANTA, at('2026-10-15T06:00:00Z'))).toEqual({ city: 'Atlanta', until: at('2026-10-15T08:00:00Z'), timeZone: 'America/New_York' });
    // Nashville from midnight, and not in Brentwood, beyond Davidson County.
    expect(activeCurfew(NASHVILLE, at('2026-10-15T05:30:00Z'))?.until).toBe(at('2026-10-15T10:00:00Z'));
    expect(activeCurfew(BRENTWOOD, at('2026-10-15T05:30:00Z'))).toBeNull();
    // Lincoln from 23:00 in winter time, until 06:00.
    expect(activeCurfew(LINCOLN, at('2026-11-10T05:00:00Z'))).toEqual({ city: 'Lincoln', until: at('2026-11-10T12:00:00Z'), timeZone: 'America/Chicago' });
    // Chicago tests riders at night instead.
    expect(activeCurfew(CHICAGO, at('2026-10-15T06:00:00Z'))).toBeNull();
    // Minneapolis from midnight to 04:00, Central time; St. Paul has no ban.
    expect(activeCurfew(MINNEAPOLIS, at('2026-10-15T04:59:00Z'))).toBeNull();
    expect(activeCurfew(MINNEAPOLIS, at('2026-10-15T05:00:00Z'))).toEqual({ city: 'Minneapolis', until: at('2026-10-15T09:00:00Z'), timeZone: 'America/Chicago' });
    expect(activeCurfew(ST_PAUL, at('2026-10-15T06:00:00Z'))).toBeNull();
    // Raleigh from 23:00 to 06:00, Eastern time, on NC State's campus too.
    expect(activeCurfew(NC_STATE, at('2026-10-15T02:59:00Z'))).toBeNull();
    expect(activeCurfew(NC_STATE, at('2026-10-15T03:00:00Z'))).toEqual({ city: 'Raleigh', until: at('2026-10-15T10:00:00Z'), timeZone: 'America/New_York' });
    // Birmingham from 23:00 to 06:00, Central time.
    expect(activeCurfew(BIRMINGHAM_AL, at('2026-10-15T04:00:00Z'))).toEqual({ city: 'Birmingham', until: at('2026-10-15T11:00:00Z'), timeZone: 'America/Chicago' });
  });

  it('stops at the edge of Oslo, and needs a place', () => {
    expect(activeCurfew(SANDVIKA, at('2026-10-12T22:00:00Z'))).toBeNull();
    expect(activeCurfew(null, at('2026-10-12T22:00:00Z'))).toBeNull();
  });
});

describe('polygonContainsPoint', () => {
  const square: [number, number][] = [[0, 0], [0, 2], [2, 2], [2, 0]];

  it('tells inside from outside', () => {
    expect(polygonContainsPoint(square, 1, 1)).toBe(true);
    expect(polygonContainsPoint(square, 1, 3)).toBe(false);
    expect(polygonContainsPoint(square, -1, 1)).toBe(false);
  });
});
