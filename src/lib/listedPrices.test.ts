import { describe, expect, it } from 'vitest';
import { PRICES_BEFORE_TAX } from '@/generated/countries';
import { providerKeyForSystemId } from '@/generated/providers';
import { LISTED_PRICES, RECHECK_AFTER_DAYS, STALE_AFTER_DAYS, listedPriceAge, listedPriceLookup, type ListedPrice } from './listedPrices';
import { REGIONAL_SCOOTER_SYSTEMS } from './regionalScooterSystems';
import { WEEKDAYS } from './rentalCurfews';

const at = (iso: string) => Date.parse(iso);

const CHICAGO: ListedPrice = {
  systems: ['lime_us_chicago'],
  currency: 'USD',
  unlock_fee_minor_units: 100,
  minute_fee_minor_units: 39,
  plus_tax: true,
  source: 'operator',
  url: 'https://www.li.me/en-us/locations/chicago',
  quote: '$1 to unlock, $0.39/min',
  checked: '2026-10-18',
};

describe('listedPriceLookup', () => {
  const lookup = listedPriceLookup([
    CHICAGO,
    { ...CHICAGO, systems: ['bird_il_israel'], currency: 'ILS', unlock_fee_minor_units: 500, minute_fee_minor_units: 70, plus_tax: false },
    // Ashdod, inside the same feed, charges less.
    {
      ...CHICAGO,
      systems: ['bird_il_israel'],
      bounds: { south: 31.75, west: 34.6, north: 31.85, east: 34.7 },
      currency: 'ILS',
      unlock_fee_minor_units: 400,
      minute_fee_minor_units: 60,
      plus_tax: false,
    },
  ], 180);

  it("gives a system's scooters its listed price, with the day it was checked", () => {
    expect(lookup('lime_us_chicago', 41.88, -87.63, at('2026-10-18T12:00:00Z'))).toEqual({
      currency: 'USD',
      unlock_fee_minor_units: 100,
      minute_fee_minor_units: 39,
      plus_tax: true,
      listed_on: '2026-10-18',
    });
    expect(lookup('lime_us_seattle', 47.6, -122.33, at('2026-10-18T12:00:00Z'))).toBeUndefined();
  });

  it('says "from" where the operator gives a range a minute', () => {
    const range = listedPriceLookup([{ ...CHICAGO, minute_fee_from: true }], 180);
    expect(range('lime_us_chicago', 41.88, -87.63, at('2026-10-18T12:00:00Z'))).toMatchObject({ minute_fee_minor_units: 39, minute_fee_from: true });
    expect(lookup('lime_us_chicago', 41.88, -87.63, at('2026-10-18T12:00:00Z'))).not.toHaveProperty('minute_fee_from');
  });

  it('prefers the price for the part of a system the scooter is in', () => {
    const now = at('2026-10-18T12:00:00Z');
    expect(lookup('bird_il_israel', 31.8, 34.65, now)?.unlock_fee_minor_units).toBe(400);
    expect(lookup('bird_il_israel', 32.08, 34.78, now)?.unlock_fee_minor_units).toBe(500);
    expect(lookup('bird_il_israel', 32.08, 34.78, now)?.plus_tax).toBeUndefined();
  });

  it('drops a price once it is older than the limit', () => {
    expect(lookup('lime_us_chicago', 41.88, -87.63, at('2027-04-16T23:59:00Z'))).toBeDefined();
    expect(lookup('lime_us_chicago', 41.88, -87.63, at('2027-04-17T00:00:00Z'))).toBeUndefined();
  });

  it("goes before the feed's price on the days it is for, by the clock of its zone", () => {
    const weekends = listedPriceLookup([{ ...CHICAGO, systems: ['beryl_gb_brighton'], days: ['sat', 'sun'],
      timeZone: 'Europe/London', currency: 'GBP', minute_fee_minor_units: 22, plus_tax: false, checked: '2026-10-23' }], 180);
    const feed = { currency: 'GBP', unlock_fee_minor_units: 100, minute_fee_minor_units: 20 };
    // Friday 23:30 in UTC is already Saturday in London, on summer time until 25 October.
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2026-10-23T22:59:00Z'), feed)).toBe(feed);
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2026-10-23T23:30:00Z'), feed)).toEqual({
      currency: 'GBP', unlock_fee_minor_units: 100, minute_fee_minor_units: 22, listed_on: '2026-10-23' });
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2026-10-25T23:30:00Z'), feed)?.minute_fee_minor_units).toBe(22);
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2026-10-26T00:30:00Z'), feed)).toBe(feed);
    // Nor on a weekday where the feed gives none, and the feed's price once the listed one is too old.
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2026-10-26T12:00:00Z'))).toBeUndefined();
    expect(weekends('beryl_gb_brighton', 50.82, -0.14, at('2027-04-24T12:00:00Z'), feed)).toBe(feed);
  });

  it('counts whole days since the check', () => {
    expect(listedPriceAge(CHICAGO, at('2026-10-18T23:00:00Z'))).toBe(0);
    expect(listedPriceAge(CHICAGO, at('2027-01-16T00:00:00Z'))).toBe(90);
  });
});

describe('data/listed-prices.json', () => {
  const systems = new Map(REGIONAL_SCOOTER_SYSTEMS.map(system => [system.id, system]));

  it('asks for a recheck well before a price is dropped', () => {
    expect(RECHECK_AFTER_DAYS).toBeGreaterThan(0);
    expect(STALE_AFTER_DAYS).toBeGreaterThan(RECHECK_AFTER_DAYS);
  });

  it.each(LISTED_PRICES.map(entry => [entry.systems.join(', '), entry] as const))('%s is a well-formed price', (_, entry) => {
    expect(entry.systems.length).toBeGreaterThan(0);
    expect(entry.currency).toMatch(/^[A-Z]{3}$/);
    expect(Number.isInteger(entry.unlock_fee_minor_units) && entry.unlock_fee_minor_units >= 0).toBe(true);
    expect(Number.isInteger(entry.minute_fee_minor_units) && entry.minute_fee_minor_units > 0).toBe(true);
    expect(entry.minute_fee_from ?? true).toBe(true);
    expect(['operator', 'city']).toContain(entry.source);
    expect(entry.url).toMatch(/^https:\/\//);
    expect(entry.quote.trim()).not.toBe('');
    expect(entry.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Days come with the zone whose days they are, and a zone only with days.
    expect(entry.timeZone === undefined).toBe(entry.days === undefined);
    for (const day of entry.days ?? []) expect(WEEKDAYS).toContain(day);
    if (entry.timeZone) expect(() => new Intl.DateTimeFormat('en-GB', { timeZone: entry.timeZone })).not.toThrow();
    expect(Date.parse(`${entry.checked}T00:00:00Z`)).toBeLessThanOrEqual(Date.now());
    for (const id of entry.systems) {
      expect(providerKeyForSystemId(id), id).toBeTruthy();
      const system = systems.get(id);
      if (system) {
        // Tax comes on top where the country's prices are given before it.
        expect(entry.plus_tax, id).toBe(PRICES_BEFORE_TAX.has(system.country));
      } else {
        // Not in a country catalog: a Swiss system from sharedmobility.ch, such as bird-zurich.
        expect(id, `${id} is in no catalog`).toMatch(/^[a-z]+-[a-z-]+$/);
        expect(entry.currency).toBe('CHF');
        expect(entry.plus_tax).toBe(false);
      }
    }
  });

  it('gives each system at most one price for the whole of it', () => {
    const whole = LISTED_PRICES.filter(entry => !entry.bounds && !entry.days).flatMap(entry => entry.systems);
    expect(whole.length).toBe(new Set(whole).size);
  });
});
