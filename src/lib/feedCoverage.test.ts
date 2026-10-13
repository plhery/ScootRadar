import { describe, expect, it } from 'vitest';
import {
  coverageForRegionNames,
  coverageIntersects,
  knownSystemCoverage,
  PUBLIBIKE_STATION_COVERAGE,
} from '@/lib/feedCoverage';
import { buildCityOverview, querySnapshot, type FeedSnapshot } from '@/lib/scooterSnapshots';
import type { MapBounds, Vehicle } from '@/lib/types';

describe('feed coverage routing', () => {
  const zurich = { south: 47.36, west: 8.52, north: 47.39, east: 8.57 };
  const basel = { south: 47.54, west: 7.56, north: 47.59, east: 7.63 };

  it('extracts city coverage from provider system IDs', () => {
    const limeZurich = knownSystemCoverage('lime_zurich');
    const birdBasel = knownSystemCoverage('bird-basel');

    expect(limeZurich).not.toBeNull();
    expect(birdBasel).not.toBeNull();
    expect(coverageIntersects(limeZurich ?? [], zurich)).toBe(true);
    expect(coverageIntersects(limeZurich ?? [], basel)).toBe(false);
    expect(coverageIntersects(birdBasel ?? [], basel)).toBe(true);
  });

  it('leaves national and unbounded systems for dynamic coverage resolution', () => {
    expect(knownSystemCoverage('voiscooters.com')).toBeNull();
    expect(knownSystemCoverage('publibike')).toBeNull();
    expect(knownSystemCoverage('lime_new-city')).toBeNull();
  });

  it('routes PubliBike station scooters only to Biel and Locarno', () => {
    expect(coverageIntersects(PUBLIBIKE_STATION_COVERAGE, {
      south: 46.14,
      west: 8.73,
      north: 46.20,
      east: 8.85,
    })).toBe(true);
    expect(coverageIntersects(PUBLIBIKE_STATION_COVERAGE, zurich)).toBe(false);
  });

  it('normalizes translated and compound region names', () => {
    const coverage = coverageForRegionNames([
      'Zürich',
      'Biel/Bienne',
      'Illnau-Effretikon',
    ]);

    expect(coverage.complete).toBe(true);
    expect(coverage.bounds).toHaveLength(3);
    expect(coverageIntersects(coverage.bounds, zurich)).toBe(true);
  });

  it('marks unknown regions incomplete so callers can use the spatial fallback', () => {
    const coverage = coverageForRegionNames(['Bern', 'New Region']);

    expect(coverage.complete).toBe(false);
    expect(coverage.bounds).toHaveLength(1);
  });
});

describe('Swiss systems that serve several towns', () => {
  const now = Date.parse('2026-10-14T08:00:00Z');
  // Street views of Wädenswil, Wil and Lichtensteig, as in the audit of 14 October 2026.
  const wadenswil = { south: 47.21, west: 8.64, north: 47.25, east: 8.70 };
  const wil = { south: 47.455, west: 9.03, north: 47.49, east: 9.07 };
  const lichtensteig = { south: 47.32, west: 9.08, north: 47.335, east: 9.095 };
  const switzerland = { south: 45.8, west: 5.9, north: 47.9, east: 10.6 };
  const scooter = (provider: string, id: string, lat: number, lng: number): Vehicle => ({
    vehicle_id: id, lat, lng, provider, battery: 70, range_m: null, distance_m: null, deep_link: null,
  });
  const national = (systemId: string, provider: string, vehicles: Vehicle[]): FeedSnapshot => ({
    id: `national:${systemId}`, source: 'national', provider, coverage: knownSystemCoverage(systemId)!, vehicles,
    observedAt: now, attemptedAt: now, stale: false, failed: false, skipped: false,
  });
  const bolt = national('bolt_zurich', 'bolt', [
    scooter('bolt', 'wadenswil', 47.2231, 8.6746), scooter('bolt', 'richterswil', 47.2062, 8.7048),
    scooter('bolt', 'schonenberg', 47.1929, 8.6433), scooter('bolt', 'zurich', 47.3769, 8.5417),
  ]);
  const dott = national('dott_st-gallen', 'dott', [
    scooter('dott', 'wil', 47.472, 9.0514), scooter('dott', 'lichtensteig', 47.3301, 9.0852), scooter('dott', 'st-gallen', 47.4245, 9.3767),
  ]);
  const feeds = [bolt, dott];
  const snapshot = { version: 1 as const, updatedAt: now, feeds, overview: buildCityOverview(feeds, now) };
  const shown = (bounds: MapBounds) => querySnapshot(snapshot, { bounds, minBattery: 0 }, 16, now).vehicles.map(vehicle => vehicle.vehicle_id);

  it('reads Bolt Zürich in Wädenswil and Dott St. Gallen in Wil and Lichtensteig, where their geofencing reaches', () => {
    expect(coverageIntersects(knownSystemCoverage('bolt_zurich')!, wadenswil)).toBe(true);
    expect(coverageIntersects(knownSystemCoverage('dott_st-gallen')!, wil)).toBe(true);
    expect(coverageIntersects(knownSystemCoverage('dott_st-gallen')!, lichtensteig)).toBe(true);
    // Lime Zürich publishes nothing there.
    expect(coverageIntersects(knownSystemCoverage('lime_zurich')!, wadenswil)).toBe(false);
  });

  it('shows their scooters at street zoom in each town', () => {
    expect(shown(wadenswil)).toEqual(['wadenswil']);
    expect(shown(wil)).toEqual(['wil']);
    expect(shown(lichtensteig)).toEqual(['lichtensteig']);
  });

  it('counts them under those towns in the city totals', () => {
    const counts = Object.fromEntries(querySnapshot(snapshot, { bounds: switzerland, minBattery: 0 }, 8, now).clusters
      .map(cluster => [cluster.id, cluster.providers]));
    expect(counts['city:ch:wadenswil']).toEqual({ bolt: 3 });
    expect(counts['city:ch:wil']).toEqual({ dott: 1 });
    expect(counts['city:ch:lichtensteig']).toEqual({ dott: 1 });
    expect(counts['city:ch:zurich']).toEqual({ bolt: 1 });
    expect(counts['city:ch:st-gallen']).toEqual({ dott: 1 });
    expect(counts['city:ch:zug']).toBeUndefined();
  });
});
