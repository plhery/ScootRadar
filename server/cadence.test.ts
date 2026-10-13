import { expect, it } from 'vitest';
import { COUNTRY_SOURCES } from '../src/lib/regionalScooterSystems';
import { alwaysFastSources, cadenceFromEnv } from './cadence';

it('collects Switzerland every minute by default, every other feed every 20 minutes and a watched one for 10', () => {
  expect(cadenceFromEnv({})).toEqual({ activeIntervalMs: 60_000, idleIntervalMs: 1_200_000, watchMs: 600_000,
    retryMs: 60_000, alwaysFastSources: new Set(['national', 'hopp', 'publibike']), idleExpiryMs: 1_800_000 });
});

it('reads countries and sources to collect every minute', () => {
  expect(alwaysFastSources('CH, fr,germany')).toEqual(new Set(['national', 'hopp', 'publibike', 'france', 'germany']));
  expect(alwaysFastSources('')).toEqual(new Set());
  expect(alwaysFastSources('all')).toEqual(new Set(['national', 'hopp', 'publibike', ...Object.values(COUNTRY_SOURCES)]));
  expect(() => alwaysFastSources('XX')).toThrow('SCOOTER_ALWAYS_FAST');
});

it('reads intervals in seconds and refuses nonsense', () => {
  const cadence = cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: '600', SCOOTER_WATCH_SECONDS: '300', SCOOTER_ALWAYS_FAST: '' });
  expect(cadence).toMatchObject({ idleIntervalMs: 600_000, watchMs: 300_000, idleExpiryMs: 1_200_000 });
  expect(cadence.alwaysFastSources.size).toBe(0);
  expect(() => cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: 'ten' })).toThrow('SCOOTER_IDLE_INTERVAL_SECONDS');
  expect(() => cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: '30' })).toThrow('at least 60');
});
