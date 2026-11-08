import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchedStatusObservedAt, isAbandonedStatus, statusAge, statusObservedAt, StatusTimestampError, validateStationStatus,
  validateVehicleStatus } from './feedValidation';

const now = Date.parse('2026-10-04T12:00:00Z');

afterEach(() => vi.restoreAllMocks());

describe('vehicle timestamp age', () => {
  it.each([5 * 60_000 + 1, 10 * 60_000 + 1, 15 * 60_000])('accepts a source timestamp %i ms old', age => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const updatedAt = now - age;
    const feed = { last_updated: updatedAt / 1000, data: { bikes: [] } };
    expect(() => validateVehicleStatus(feed)).not.toThrow();
    expect(statusObservedAt(feed)).toBe(updatedAt);
    expect(statusObservedAt({ last_updated: new Date(updatedAt).toISOString() })).toBe(updatedAt);
  });

  it.each([null, 'invalid', (now - 15 * 60_000 - 1) / 1000, (now + 5 * 60_000 + 1) / 1000])(
    'rejects missing, invalid, expired or excessively future timestamps: %s', last_updated => {
      expect(() => statusObservedAt({ last_updated }, now)).toThrow('Status timestamp is missing or out of date');
    },
  );

  it('tells a missing, old and future timestamp apart by the document\'s own age, under the one message', () => {
    const rejection = (last_updated: unknown) => {
      try { statusObservedAt({ last_updated }, now); } catch (error) { return error; }
    };
    const errors = [null, 'invalid', (now - 1_699_000) / 1000, new Date(now + 400_000).toISOString()].map(rejection);
    expect(errors.map(error => (error as Error).message)).toEqual(Array(4).fill('Status timestamp is missing or out of date'));
    expect(errors.map(statusAge)).toEqual([{ statusAgeSeconds: null }, { statusAgeSeconds: null }, { statusAgeSeconds: 1699 },
      { statusAgeSeconds: -400 }]);
    expect(statusAge(new Error('GBFS request failed with HTTP 503'))).toEqual({});
  });

  it('gives the operator\'s document\'s age, not that of the copy held while its request failed', () => {
    const held = { last_updated: (now - 16 * 60_000) / 1000 };
    const operators = new StatusTimestampError(-400);
    expect(() => fetchedStatusObservedAt({ data: held, failure: operators }, now)).toThrow(operators);
    // Another failure, as an HTTP error, leaves the copy's own rejection.
    const fallback = (failure: unknown) => {
      try { fetchedStatusObservedAt({ data: held, failure }, now); } catch (error) { return statusAge(error); }
    };
    expect(fallback(new Error('GBFS request failed with HTTP 503'))).toEqual({ statusAgeSeconds: 960 });
    expect(fallback(undefined)).toEqual({ statusAgeSeconds: 960 });
    // A copy still young enough is served, whatever the request's failure.
    expect(fetchedStatusObservedAt({ data: { last_updated: (now - 60_000) / 1000 }, failure: operators }, now)).toBe(now - 60_000);
  });

  it('tells an abandoned feed from a late one', () => {
    expect(isAbandonedStatus({ last_updated: 0 }, now)).toBe(true);
    expect(isAbandonedStatus({ last_updated: (now - 7 * 86400_000 - 1) / 1000 }, now)).toBe(true);
    expect(isAbandonedStatus({ last_updated: (now - 7 * 86400_000) / 1000 }, now)).toBe(false);
    expect(isAbandonedStatus({ last_updated: (now - 3600_000) / 1000 }, now)).toBe(false);
    expect(isAbandonedStatus({}, now)).toBe(false);
    expect(isAbandonedStatus(null, now)).toBe(false);
  });

  it('keeps parking availability limited to five minutes', () => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect(() => validateStationStatus({ last_updated: (now - 5 * 60_000) / 1000, data: { stations: [] } })).not.toThrow();
    expect(() => validateStationStatus({ last_updated: (now - 5 * 60_000 - 1) / 1000, data: { stations: [] } })).toThrow();
  });
});
