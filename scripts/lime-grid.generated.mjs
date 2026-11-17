// Written by scripts/generate-provider-catalog.mjs: src/lib/limeGrid.ts as JavaScript, for a run without esbuild.
const LIME_TILE_GROUP_SIZE = 4;
const round = (value) => Math.round(value * 1e8) / 1e8;
const columnsOf = (grid) => Math.max(1, Math.ceil((grid.east - grid.west) / grid.lngStep));
function limeGridCell(grid, row, column) {
  return {
    south: grid.south + row * grid.latStep,
    north: Math.min(grid.north, grid.south + (row + 1) * grid.latStep),
    west: grid.west + column * grid.lngStep,
    east: Math.min(grid.east, grid.west + (column + 1) * grid.lngStep)
  };
}
function limeGridRuns(indexes) {
  const runs = [];
  for (let i = 0; i < indexes.length; ) {
    let last = i;
    while (last + 1 < indexes.length && indexes[last + 1] === indexes[last] + 1) last++;
    runs.push(last > i ? `${indexes[i]}-${indexes[last]}` : String(indexes[i]));
    i = last + 1;
  }
  return runs.join(",");
}
function limeGridTiles(grid) {
  if (!grid.cells) return [];
  const columns = columnsOf(grid);
  return grid.cells.split(",").flatMap((run) => {
    const [first, last = first] = run.split("-").map(Number);
    if (!Number.isInteger(first) || !Number.isInteger(last) || last < first) throw new Error(`Invalid Lime grid cells ${run}`);
    return Array.from({ length: last - first + 1 }, (_, i) => {
      const cell = limeGridCell(grid, Math.floor((first + i) / columns), (first + i) % columns);
      return { south: round(cell.south), north: round(cell.north), west: round(cell.west), east: round(cell.east) };
    });
  });
}
function overlap(a, b) {
  const box = {
    south: Math.max(a.south, b.south),
    west: Math.max(a.west, b.west),
    north: Math.min(a.north, b.north),
    east: Math.min(a.east, b.east)
  };
  return box.south < box.north && box.west < box.east ? box : null;
}
function limeGridGroups(system) {
  const { limeMapGrid: grid, towns = [], ...market } = system;
  if (!grid) return [system];
  const tiles = limeGridTiles(grid);
  const groups = [];
  for (let i = 0; i < tiles.length; i += LIME_TILE_GROUP_SIZE) {
    const group = tiles.slice(i, i + LIME_TILE_GROUP_SIZE);
    groups.push({
      ...market,
      id: `${market.id}_${String(i / LIME_TILE_GROUP_SIZE).padStart(3, "0")}`,
      bounds: {
        south: Math.min(...group.map((b) => b.south)),
        north: Math.max(...group.map((b) => b.north)),
        west: Math.min(...group.map((b) => b.west)),
        east: Math.max(...group.map((b) => b.east))
      },
      areas: group.flatMap((bounds) => [
        {
          city: market.city,
          center: market.center,
          ...market.aliases?.length ? { aliases: market.aliases } : {},
          bounds
        },
        ...towns.flatMap((town) => {
          const met = overlap(bounds, town.bounds);
          return met ? [{ city: town.city, ...town.region ? { region: town.region } : {}, center: town.center, bounds: met }] : [];
        })
      ]),
      limeMapTiles: group
    });
  }
  return groups;
}
function rydeGridGroups(system) {
  const { rydeMapGrid: grid, ...market } = system;
  if (!grid) return [system];
  const tiles = limeGridTiles(grid), groups = [];
  for (let i = 0; i < tiles.length; i += 2) {
    const group = tiles.slice(i, i + 2);
    groups.push({
      ...market,
      id: `${market.id}_${String(i / 2).padStart(3, "0")}`,
      bounds: { south: Math.min(...group.map((b) => b.south)), north: Math.max(...group.map((b) => b.north)), west: Math.min(...group.map((b) => b.west)), east: Math.max(...group.map((b) => b.east)) },
      areas: group.map((bounds) => ({ city: market.city, center: market.center, bounds })),
      rydeMapTiles: group
    });
  }
  return groups;
}
export {
  LIME_TILE_GROUP_SIZE,
  limeGridCell,
  limeGridGroups,
  limeGridRuns,
  limeGridTiles,
  rydeGridGroups
};
