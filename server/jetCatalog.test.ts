import { describe, expect, it } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { jetMapTiles, withJetAppCollectors } from './jetApp';

const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.jetAppMap);

describe('reviewed Go Jet coverage', () => {
  it('registers only the six verified markets and gives every collection a bounded, disjoint envelope', () => {
    expect([...new Set(systems.map(system => system.country))].sort()).toEqual(['AZ', 'BR', 'CL', 'GE', 'KZ', 'MX']);
    expect(systems).toHaveLength(54);
    for (const system of systems) {
      expect(system.id).toMatch(/^jet_[a-z]{2}_[a-z0-9-]+$/);
      expect(system.provider).toBe('jet');
      expect(jetMapTiles(system.bounds).length).toBeLessThanOrEqual(96);
      for (const other of systems) {
        if (system.id === other.id || system.country !== other.country) continue;
        const a = system.bounds, b = other.bounds;
        expect(a.south < b.north && a.north > b.south && a.west < b.east && a.east > b.west,
          `${system.id} overlaps ${other.id}`).toBe(false);
      }
    }
    expect(systems.some(system => ['São Luís', 'Ciudad de México'].includes(system.city))).toBe(false);
  });

  it('installs Node collectors without treating their endpoints as GBFS or exposing signing configuration', () => {
    const feeds = independentCollectableFeeds();
    const installed = withJetAppCollectors(feeds, systems);
    const jet = installed.filter(feed => feed.provider === 'jet');
    expect(jet).toHaveLength(systems.length);
    for (const feed of jet) {
      expect(feed.host).toBe('api.gojet.app');
      expect(feed.zoneSource).toBeUndefined();
      expect(feed.collect).not.toBe(feeds.find(previous => previous.id === feed.id)!.collect);
    }
    expect(JSON.stringify(systems)).not.toMatch(/signingKey|X-Signature|deviceId/);
  });
});
