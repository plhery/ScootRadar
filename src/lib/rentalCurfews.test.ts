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
const at = (iso: string) => Date.parse(iso);

describe('activeCurfew', () => {
  it('holds in Oslo from 23:00 to 05:00, Oslo time', () => {
    // 22:59 and 23:00 in Oslo, summer time.
    expect(activeCurfew(OSLO, at('2026-10-12T20:59:00Z'))).toBeNull();
    expect(activeCurfew(OSLO, at('2026-10-12T21:00:00Z'))).toEqual({ city: 'Oslo', until: at('2026-10-13T03:00:00Z') });
    expect(activeCurfew(OSLO, at('2026-10-13T02:59:30Z'))).toEqual({ city: 'Oslo', until: at('2026-10-13T03:00:00Z') });
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
    expect(activeCurfew(TRONDHEIM, at('2026-10-16T21:30:00Z'))).toEqual({ city: 'Trondheim', until: at('2026-10-17T03:00:00Z') });
    expect(activeCurfew(TRONDHEIM, at('2026-10-17T02:00:00Z'))?.until).toBe(at('2026-10-17T03:00:00Z'));
    expect(activeCurfew(TRONDHEIM, at('2026-10-17T22:30:00Z'))?.until).toBe(at('2026-10-18T03:00:00Z'));
    // Sunday 23:30.
    expect(activeCurfew(TRONDHEIM, at('2026-10-18T21:30:00Z'))).toBeNull();
  });

  it('reads a night that starts at midnight as the early hours after the evening', () => {
    // Stavanger bans 00:00–05:00 after Friday and Saturday: not at Friday 23:30, but at Saturday 00:30.
    expect(activeCurfew(STAVANGER, at('2026-10-16T21:30:00Z'))).toBeNull();
    expect(activeCurfew(STAVANGER, at('2026-10-16T22:30:00Z'))).toEqual({ city: 'Stavanger', until: at('2026-10-17T03:00:00Z') });
    // Not after Thursday.
    expect(activeCurfew(STAVANGER, at('2026-10-15T22:30:00Z'))).toBeNull();
  });

  it('takes the window of the night it is when a city has several', () => {
    // Tønsberg: 23:00–05:00 after Friday and Saturday, 01:00–05:00 after the other evenings.
    expect(activeCurfew(TONSBERG, at('2026-10-13T21:30:00Z'))).toBeNull();
    expect(activeCurfew(TONSBERG, at('2026-10-13T23:30:00Z'))).toEqual({ city: 'Tønsberg', until: at('2026-10-14T03:00:00Z') });
    expect(activeCurfew(TONSBERG, at('2026-10-16T21:30:00Z'))?.until).toBe(at('2026-10-17T03:00:00Z'));
  });

  it('finds a city on an island of its municipality', () => {
    // Tromsø's centre is on Tromsøya; its ban runs to 06:00 after Friday and Saturday.
    expect(activeCurfew(TROMSO, at('2026-10-16T21:30:00Z'))).toEqual({ city: 'Tromsø', until: at('2026-10-17T04:00:00Z') });
  });

  it('reads British bans in London time', () => {
    // 00:30 in Brighton, summer time; Poole closes from 22:00.
    expect(activeCurfew(BRIGHTON, at('2026-10-12T23:30:00Z'))).toEqual({ city: 'Brighton', until: at('2026-10-13T04:00:00Z') });
    expect(activeCurfew(BRIGHTON, at('2026-10-12T22:30:00Z'))).toBeNull();
    expect(activeCurfew(POOLE, at('2026-10-12T21:30:00Z'))).toEqual({ city: 'Poole', until: at('2026-10-13T04:00:00Z') });
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
