import type { MapBounds } from './types';

/** How many local views a Lime refresh group holds: a street view wakes the groups near it, not the city. */
export const LIME_TILE_GROUP_SIZE = 4;

/**
 * A Lime market's local views as its catalog keeps them (scripts/lime-app-catalog.mjs): cells of
 * latStep by lngStep from the south-west corner of its service polygons' bounds, and those that
 * meet a polygon, as runs of their indexes counted row by row from there, "0-5,9,12-14". Written
 * out view by view, Lime's markets made the catalogs, which every map page loads, megabytes larger.
 */
export interface LimeMapGrid {
  south: number;
  west: number;
  north: number;
  east: number;
  latStep: number;
  lngStep: number;
  cells: string;
}

const round = (value: number) => Math.round(value * 1e8) / 1e8;
const columnsOf = (grid: LimeMapGrid) => Math.max(1, Math.ceil((grid.east - grid.west) / grid.lngStep));

/** The cell of the grid at a row and column, cut at its bounds, as server/limeAreas.ts tests it against the polygons. */
export function limeGridCell(grid: LimeMapGrid, row: number, column: number): MapBounds {
  return { south: grid.south + row * grid.latStep, north: Math.min(grid.north, grid.south + (row + 1) * grid.latStep),
    west: grid.west + column * grid.lngStep, east: Math.min(grid.east, grid.west + (column + 1) * grid.lngStep) };
}

/** The indexes of the grid's cells as its catalog writes them. */
export function limeGridRuns(indexes: readonly number[]): string {
  const runs: string[] = [];
  for (let i = 0; i < indexes.length;) {
    let last = i;
    while (last + 1 < indexes.length && indexes[last + 1] === indexes[last] + 1) last++;
    runs.push(last > i ? `${indexes[i]}-${indexes[last]}` : String(indexes[i]));
    i = last + 1;
  }
  return runs.join(',');
}

/** The market's local views, in order, to a hundred-millionth of a degree. */
export function limeGridTiles(grid: LimeMapGrid): MapBounds[] {
  if (!grid.cells) return [];
  const columns = columnsOf(grid);
  return grid.cells.split(',').flatMap(run => {
    const [first, last = first] = run.split('-').map(Number);
    if (!Number.isInteger(first) || !Number.isInteger(last) || last < first) throw new Error(`Invalid Lime grid cells ${run}`);
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const cell = limeGridCell(grid, Math.floor((first + i) / columns), (first + i) % columns);
      return { south: round(cell.south), north: round(cell.north), west: round(cell.west), east: round(cell.east) };
    });
  });
}

interface LimeMarketEntry {
  id: string;
  city: string;
  center: [number, number];
  aliases?: string[];
  limeMapGrid?: LimeMapGrid;
}

/**
 * The refresh groups of a catalog's Lime market, each a system and cache feed of its own,
 * "lime_de_app_berlin_000" and on: LIME_TILE_GROUP_SIZE consecutive views, each an area of its
 * own, so that a view in the gap of a group's rectangle wakes only the group whose cell it meets.
 * Any other system is itself.
 */
export function limeGridGroups<T extends LimeMarketEntry>(system: T): T[] {
  const { limeMapGrid: grid, ...market } = system;
  if (!grid) return [system];
  const tiles = limeGridTiles(grid);
  const groups: T[] = [];
  for (let i = 0; i < tiles.length; i += LIME_TILE_GROUP_SIZE) {
    const group = tiles.slice(i, i + LIME_TILE_GROUP_SIZE);
    groups.push({ ...market, id: `${market.id}_${String(i / LIME_TILE_GROUP_SIZE).padStart(3, '0')}`,
      bounds: { south: Math.min(...group.map(b => b.south)), north: Math.max(...group.map(b => b.north)),
        west: Math.min(...group.map(b => b.west)), east: Math.max(...group.map(b => b.east)) },
      areas: group.map(bounds => ({ city: market.city, center: market.center,
        ...(market.aliases?.length ? { aliases: market.aliases } : {}), bounds })),
      limeMapTiles: group } as unknown as T);
  }
  return groups;
}
