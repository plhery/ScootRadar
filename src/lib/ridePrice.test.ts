import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_RIDE_DURATION,
  RIDE_DURATIONS,
  RIDE_DURATION_STORAGE_KEY,
  currencyFractionDigits,
  formatListedDay,
  formatRidePrice,
  loadRideDuration,
  normalizeRideDuration,
  ridePriceQuote,
  saveRideDuration,
} from '@/lib/ridePrice';

const LIME = { currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 35 };

// Intl separates amount and currency with no-break spaces.
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('ride durations', () => {
  it('allows 5, 10, 15, 20 and 30 minutes with 10 as the default', () => {
    expect(RIDE_DURATIONS).toEqual([5, 10, 15, 20, 30]);
    expect(DEFAULT_RIDE_DURATION).toBe(10);
  });

  it('falls back to the default for anything else', () => {
    for (const minutes of RIDE_DURATIONS) expect(normalizeRideDuration(minutes)).toBe(minutes);
    for (const other of [0, 7, 25, 60, -5, 10.5, NaN, '15', null, undefined]) {
      expect(normalizeRideDuration(other)).toBe(10);
    }
  });
});

describe('ridePriceQuote', () => {
  it('adds the unlock fee to the minutes ridden', () => {
    expect(ridePriceQuote(LIME, 10)).toEqual({
      currency: 'CHF',
      durationMinutes: 10,
      unlockFeeMinorUnits: 100,
      minuteFeeMinorUnits: 35,
      totalMinorUnits: 450,
      plusTax: false,
      minuteFeeFrom: false,
      listedOn: null,
    });
    expect(ridePriceQuote(LIME, 30).totalMinorUnits).toBe(1150);
    expect(ridePriceQuote(LIME, 0).totalMinorUnits).toBe(100);
  });

  it('says whether tax is added to the estimate', () => {
    expect(ridePriceQuote({ ...LIME, currency: 'USD', plus_tax: true }, 10)).toMatchObject({ totalMinorUnits: 450, plusTax: true });
  });

  it('says when the minute fee is the lowest of a range, so the estimate is the least the ride costs', () => {
    expect(ridePriceQuote({ ...LIME, minute_fee_from: true }, 10)).toMatchObject({ totalMinorUnits: 450, minuteFeeFrom: true });
  });

  it("keeps the day a price copied from the operator's price list was checked", () => {
    expect(ridePriceQuote({ ...LIME, listed_on: '2026-10-18' }, 10)).toMatchObject({ totalMinorUnits: 450, listedOn: '2026-10-18' });
  });

  it('handles tariffs without an unlock fee or without a minute fee', () => {
    expect(ridePriceQuote({ ...LIME, unlock_fee_minor_units: 0 }, 20).totalMinorUnits).toBe(700);
    expect(ridePriceQuote({ ...LIME, minute_fee_minor_units: 0 }, 20).totalMinorUnits).toBe(100);
  });

  it('never goes below zero for negative input, like the iOS estimator', () => {
    expect(ridePriceQuote({ currency: 'EUR', unlock_fee_minor_units: -100, minute_fee_minor_units: 25 }, 10).totalMinorUnits).toBe(250);
    expect(ridePriceQuote({ currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: -25 }, 10).totalMinorUnits).toBe(100);
    expect(ridePriceQuote(LIME, -10)).toMatchObject({ durationMinutes: 0, totalMinorUnits: 100 });
  });

  it('stays a safe whole number for absurd or broken tariffs', () => {
    expect(ridePriceQuote({ currency: 'CHF', unlock_fee_minor_units: 1, minute_fee_minor_units: Number.MAX_SAFE_INTEGER }, 30).totalMinorUnits)
      .toBe(Number.MAX_SAFE_INTEGER);
    expect(ridePriceQuote({ currency: 'CHF', unlock_fee_minor_units: NaN, minute_fee_minor_units: 35.9 }, 10).totalMinorUnits).toBe(350);
  });
});

describe('formatListedDay', () => {
  const now = Date.parse('2026-12-01T12:00:00Z');

  it('gives the day and month in the app language, and the year when it is not this one', () => {
    expect(formatListedDay('2026-10-18', 'en', 'CH', now)).toBe('18 Oct');
    expect(formatListedDay('2026-10-18', 'en', 'US', now)).toBe('Oct 18');
    expect(formatListedDay('2026-10-18', 'de', 'CH', now)).toBe('18. Okt.');
    expect(formatListedDay('2026-10-18', 'fr', 'CH', now)).toBe('18 oct.');
    expect(formatListedDay('2025-12-30', 'en', 'CH', now)).toBe('30 Dec 2025');
  });

  it('leaves a day it cannot read as it is', () => {
    expect(formatListedDay('soon', 'en', 'CH', now)).toBe('soon');
  });
});

describe('formatRidePrice', () => {
  it('formats Swiss francs and euros for each app language', () => {
    expect(plain(formatRidePrice(450, 'CHF', 'en'))).toBe('CHF 4.50');
    expect(plain(formatRidePrice(450, 'CHF', 'de'))).toBe('CHF 4.50');
    expect(plain(formatRidePrice(450, 'CHF', 'fr'))).toBe('4.50 CHF');
    expect(plain(formatRidePrice(450, 'CHF', 'it'))).toBe('CHF 4.50');
    expect(plain(formatRidePrice(325, 'EUR', 'fr'))).toBe('3.25 €');
    expect(plain(formatRidePrice(325, 'EUR', 'de'))).toBe('EUR 3.25');
  });

  it('always shows two decimals', () => {
    expect(plain(formatRidePrice(400, 'CHF', 'en'))).toBe('CHF 4.00');
    expect(plain(formatRidePrice(5, 'CHF', 'en'))).toBe('CHF 0.05');
    expect(plain(formatRidePrice(0, 'CHF', 'en'))).toBe('CHF 0.00');
  });

  it('accepts a lower-case code and survives one that is not a currency', () => {
    expect(plain(formatRidePrice(450, 'chf', 'en'))).toBe('CHF 4.50');
    expect(formatRidePrice(450, 'francs', 'en')).toBe('FRANCS 4.50');
    expect(currencyFractionDigits('francs')).toBe(2);
  });

  it('shows the króna and the forint without decimals', () => {
    expect(plain(formatRidePrice(35000, 'ISK', 'en'))).toBe('ISK 350');
    // Hopp in Pécs: HUF 272 to start and HUF 76 a minute.
    expect(plain(formatRidePrice(27200, 'HUF', 'en'))).toBe('HUF 272');
    expect(plain(formatRidePrice(7600, 'huf', 'fr'))).toBe('76 HUF');
    expect(plain(formatRidePrice(103200, 'HUF', 'de'))).toBe("HUF 1'032");
    expect([currencyFractionDigits('ISK'), currencyFractionDigits('HUF'), currencyFractionDigits('huf')]).toEqual([0, 0, 0]);
  });

  it('keeps the kopiyky of a price in hryvnias', () => {
    // 3electra in Kyiv: UAH 12 to start and UAH 5.60 a minute.
    expect(plain(formatRidePrice(1200, 'UAH', 'en'))).toBe('UAH 12.00');
    expect(plain(formatRidePrice(560, 'UAH', 'de'))).toBe('UAH 5.60');
    expect(plain(formatRidePrice(560, 'uah', 'fr'))).toBe('5.60 UAH');
    expect(currencyFractionDigits('UAH')).toBe(2);
  });

  it('shows whole forints even where Intl gives HUF two decimals, as Safari does', () => {
    // WebKit follows ISO 4217, which still lists the fillér; Chrome and Node don't.
    const resolvedOptions = Intl.NumberFormat.prototype.resolvedOptions;
    vi.spyOn(Intl.NumberFormat.prototype, 'resolvedOptions').mockImplementation(function (this: Intl.NumberFormat) {
      return { ...resolvedOptions.call(this), maximumFractionDigits: 2 };
    });
    expect(currencyFractionDigits('HUF')).toBe(0);
    expect(plain(formatRidePrice(27200, 'HUF', 'en'))).toBe('HUF 272');
    expect(plain(formatRidePrice(450, 'CHF', 'en'))).toBe('CHF 4.50');
  });
});

describe('stored ride duration', () => {
  beforeEach(() => localStorage.clear());

  it('starts with the default', () => {
    expect(loadRideDuration()).toBe(10);
  });

  it('remembers the chosen duration', () => {
    expect(saveRideDuration(20)).toBe(20);
    expect(localStorage.getItem(RIDE_DURATION_STORAGE_KEY)).toBe('20');
    expect(loadRideDuration()).toBe(20);
  });

  it('stores and restores only allowed durations', () => {
    expect(saveRideDuration(25)).toBe(10);
    expect(localStorage.getItem(RIDE_DURATION_STORAGE_KEY)).toBe('10');
    for (const stored of ['45', 'abc', '', '15.5', '{"minutes":15}']) {
      localStorage.setItem(RIDE_DURATION_STORAGE_KEY, stored);
      expect(loadRideDuration(), stored).toBe(10);
    }
  });

  it('works without storage', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(loadRideDuration()).toBe(10);
    expect(saveRideDuration(30)).toBe(30);
  });
});
