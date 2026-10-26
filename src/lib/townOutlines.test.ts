import { describe, expect, it } from 'vitest';
import catalog from '../../data/town-outlines.json';
import { polygonContainsPoint } from './geo';
import { outlinedTown } from './townOutlines';

const towns = catalog.towns as unknown as { city: string; areas: [number, number][][] }[];
const countryOf = (city: string) => city.slice(0, city.indexOf(':'));

describe('outlinedTown', () => {
  it('finds a town for a point exactly where testing every edge of every outline does', () => {
    // Points across each outline's box, at its vertices' own latitudes too, where a point meets the
    // end of an edge and a band of latitude can start.
    let seed = 1;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    let held = 0;
    const misplaced: string[] = [];
    for (const town of towns) {
      const country = towns.filter(other => countryOf(other.city) === countryOf(town.city));
      const ofCountry = country.map(other => ({ id: other.city }));
      const points = town.areas.flat();
      const lats = points.map(([lat]) => lat);
      const lngs = points.map(([, lng]) => lng);
      const [south, north, west, east] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)];
      for (let n = 0; n < 60; n++) {
        const lat = n % 2 ? lats[Math.floor(random() * lats.length)] : south + random() * (north - south);
        const lng = west + random() * (east - west);
        const holding = country.filter(other => other.areas.some(ring => polygonContainsPoint(ring, lat, lng))).map(other => other.city);
        const found = outlinedTown(ofCountry, lat, lng)?.id;
        if (holding.length) held++;
        if (found === undefined ? holding.length > 0 : !holding.includes(found)) misplaced.push(`${town.city} ${lat},${lng}`);
      }
    }
    expect(misplaced).toEqual([]);
    expect(held).toBeGreaterThan(towns.length * 15);
  });
});
