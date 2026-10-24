import { describe, expect, it } from 'vitest';
import { limeGridGroups, limeGridRuns, limeGridTiles, type LimeMapGrid } from './limeGrid';

const grid = (cells: string): LimeMapGrid => ({ south: 0, west: 0, north: .025, east: .035, latStep: .01, lngStep: .01, cells });

describe('Lime market grids', () => {
  it('writes the indexes of the cells as runs, and reads them back row by row, cut at the bounds', () => {
    expect(limeGridRuns([0, 1, 2, 5, 7, 8, 11])).toBe('0-2,5,7-8,11');
    expect(limeGridRuns([])).toBe('');
    // Four columns, the last 5 thousandths of a degree wide; three rows, the last half as tall.
    expect(limeGridTiles(grid('3-4,11'))).toEqual([
      { south: 0, north: .01, west: .03, east: .035 },
      { south: .01, north: .02, west: 0, east: .01 },
      { south: .02, north: .025, west: .03, east: .035 },
    ]);
    expect(limeGridTiles(grid(''))).toEqual([]);
    expect(() => limeGridTiles(grid('4-2'))).toThrow('Invalid Lime grid cells 4-2');
  });

  it('splits a market into refresh groups of four cells, each cell an area of its own', () => {
    const market = { id: 'lime_ro_app_deva', provider: 'lime', city: 'Deva', center: [0, 0] as [number, number],
      aliases: ['Déva'], limeAppMap: true, limeMapGrid: grid('0-5') };
    const groups = limeGridGroups(market);
    expect(groups.map(group => group.id)).toEqual(['lime_ro_app_deva_000', 'lime_ro_app_deva_001']);
    expect(groups.map(group => (group as { limeMapTiles?: unknown[] }).limeMapTiles?.length)).toEqual([4, 2]);
    expect(groups[1]).toMatchObject({ provider: 'lime', limeAppMap: true, bounds: { south: .01, north: .02, west: 0, east: .02 },
      areas: [{ city: 'Deva', aliases: ['Déva'], bounds: { south: .01, north: .02, west: 0, east: .01 } },
        { city: 'Deva', aliases: ['Déva'], bounds: { south: .01, north: .02, west: .01, east: .02 } }] });
    expect(groups.some(group => 'limeMapGrid' in group)).toBe(false);
    const other = { id: 'lime_public', city: 'Deva', center: [0, 0] as [number, number] };
    expect(limeGridGroups(other)).toEqual([other]);
  });
});
