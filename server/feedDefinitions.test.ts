import { expect, it, vi } from 'vitest';
import { feedsForQuery, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { discoverOnceMore, registerFeedDefinitions } from './feedDefinitions';

const definition = { id: 'romania:test', source: 'romania' as const, provider: 'lime' as const, coverage: [
  { south: 0, north: .5, west: 0, east: .5 },
  { south: 1.5, north: 2, west: 1.5, east: 2 },
] };

it('replaces restored coverage immediately without refreshing its scooter observations', () => {
  const previous: FeedSnapshot = { ...definition, coverage: [{ south: 0, north: 2, west: 0, east: 2 }],
    vehicles: [{ provider: 'lime', vehicle_id: 'known', lat: .2, lng: .2, battery: 80,
      range_m: null, deep_link: null, distance_m: null }],
    observedAt: 100, attemptedAt: 120, collectedAt: 130, stale: false, failed: false, skipped: false };
  const records = new Map([[definition.id, previous]]);
  const snapshot = (): MobilitySnapshot => ({ version: 1, updatedAt: 140, feeds: [...records.values()],
    overview: { generatedAt: 140, feedIds: [definition.id], cities: [] } });
  const query = { origin: null, minBattery: 0, bounds: { south: .9, north: 1.1, west: .9, east: 1.1 } };
  expect(feedsForQuery(snapshot(), query, 18)).toHaveLength(1);
  registerFeedDefinitions(records, [definition]);
  expect(feedsForQuery(snapshot(), query, 18)).toHaveLength(0);
  expect(feedsForQuery(snapshot(), { ...query, bounds: definition.coverage[0] }, 18)).toHaveLength(1);
  expect(records.get(definition.id)).toMatchObject({ observedAt: 100, attemptedAt: 120, collectedAt: 130,
    stale: false, failed: false, skipped: false });
  expect(records.get(definition.id)?.vehicles).toBe(previous.vehicles);
});

it('keeps an unseen feed unavailable until its first successful collection', () => {
  const records = new Map<string, FeedSnapshot>();
  registerFeedDefinitions(records, [definition]);
  expect(records.get(definition.id)).toMatchObject({ coverage: definition.coverage, vehicles: [],
    observedAt: 0, attemptedAt: 0, stale: true, failed: true, skipped: false });
});

it('asks for the catalog once more after a pause before a failure counts', async () => {
  vi.useFakeTimers();
  try {
    const gatewayTimeout = new Error('GBFS request failed with HTTP 504');
    const discover = vi.fn().mockRejectedValueOnce(gatewayTimeout).mockResolvedValueOnce(['catalog']);
    const retried: unknown[] = [];
    const result = discoverOnceMore(discover, 5_000, error => retried.push(error));
    await vi.advanceTimersByTimeAsync(4_999);
    expect(discover).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual(['catalog']);
    expect(discover).toHaveBeenCalledTimes(2);
    expect(retried).toEqual([gatewayTimeout]);
  } finally {
    vi.useRealTimers();
  }
});

it('throws the second failure, and asks only once when the first try succeeds', async () => {
  const second = new Error('GBFS request failed with HTTP 502');
  const failing = vi.fn().mockRejectedValueOnce(new Error('GBFS request failed with HTTP 504')).mockRejectedValueOnce(second);
  await expect(discoverOnceMore(failing, 0, () => {})).rejects.toBe(second);
  expect(failing).toHaveBeenCalledTimes(2);
  const working = vi.fn().mockResolvedValue(['catalog']);
  const onRetry = vi.fn();
  await expect(discoverOnceMore(working, 0, onRetry)).resolves.toEqual(['catalog']);
  expect(working).toHaveBeenCalledTimes(1);
  expect(onRetry).not.toHaveBeenCalled();
});
