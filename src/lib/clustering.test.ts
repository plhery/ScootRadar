import { describe, expect, it } from 'vitest';
import { clusterVehicles, groupCityTotals, shouldClusterAtZoom } from '@/lib/clustering';
import type { ScooterCluster, Vehicle } from '@/lib/types';

function vehicle(id: string, provider: string, lat: number, lng: number): Vehicle {
  return {
    provider,
    lat,
    lng,
    battery: 80,
    range_m: 10_000,
    vehicle_id: id,
    deep_link: null,
    distance_m: null,
  };
}

describe('web clustering', () => {
  it('clusters through zoom 15 and separates scooters above it', () => {
    expect(shouldClusterAtZoom(14)).toBe(true);
    expect(shouldClusterAtZoom(15)).toBe(true);
    expect(shouldClusterAtZoom(16)).toBe(false);
  });

  it('rejects invalid zoom values', () => {
    expect(shouldClusterAtZoom(Number.NaN)).toBe(false);
    expect(shouldClusterAtZoom(Number.POSITIVE_INFINITY)).toBe(false);
  });

  it('groups nearby vehicles into deterministic provider-aware cells', () => {
    const result = clusterVehicles([
      vehicle('lime-1', 'lime', 47.37690, 8.54170),
      vehicle('lime-2', 'lime', 47.37691, 8.54171),
      vehicle('voi-1', 'voi', 47.37692, 8.54172),
      vehicle('far-away', 'bird', 47.39, 8.57),
    ], 15);

    expect(result.vehicles.map(item => item.vehicle_id)).toEqual(['far-away']);
    expect(result.clusters).toHaveLength(1);
    expect(result.clusters[0]).toMatchObject({
      count: 3,
      providers: { lime: 2, voi: 1 },
    });
    expect(result.clusters[0].id).toMatch(/^15:\d+:\d+$/);
    expect(result.clusters[0].lat).toBeCloseTo(47.37691);
    expect(result.clusters[0].lng).toBeCloseTo(8.54171);
  });

  it('returns raw vehicles above the clustering threshold', () => {
    const vehicles = [
      vehicle('lime-1', 'lime', 47.3769, 8.5417),
      vehicle('lime-2', 'lime', 47.37691, 8.54171),
    ];

    expect(clusterVehicles(vehicles, 16)).toEqual({ vehicles, clusters: [] });
  });
});

function city(id: string, lat: number, lng: number, providers: Record<string, number>): ScooterCluster {
  const count = Object.values(providers).reduce((total, value) => total + value, 0);
  return { id: `city:${id}`, city: id, lat, lng, count, providers };
}

describe('city totals', () => {
  const paris = city('Paris', 48.8566, 2.3522, { dott: 3000, lime: 1000 });
  const boulogne = city('Boulogne', 48.8397, 2.2399, { dott: 200 });
  const lyon = city('Lyon', 45.764, 4.8357, { voi: 900 });

  it('draws neighbouring cities as one total on the largest of them', () => {
    const [group, other] = groupCityTotals([boulogne, lyon, paris], 6);
    expect(group).toMatchObject({
      id: 'group:city:Paris', city: 'Paris, Boulogne', lat: paris.lat, lng: paris.lng,
      count: 4200, providers: { dott: 3200, lime: 1000 },
      bounds: { south: boulogne.lat, west: boulogne.lng, north: paris.lat, east: paris.lng },
    });
    expect(other).toBe(lyon);
  });

  it('leaves cities apart once they can be told apart', () => {
    expect(groupCityTotals([paris, boulogne, lyon], 12)).toEqual([paris, lyon, boulogne]);
  });
});
