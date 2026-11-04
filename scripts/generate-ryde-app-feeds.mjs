// Native metadata owns the collection envelopes; existing public Ryde feeds keep their coverage.
import { readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const compiled = await build({ entryPoints: [new URL('server/limeAreas.ts', root).pathname], bundle: true, platform: 'node', format: 'esm', write: false });
const { limeAreaGrid, limeAreaTiles } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const source = read('data/ryde-bridge-areas.json');
for (const country of read('data/countries.json').countries) {
  const areas = source.areas.filter(a => a.country === country.code && a.productionPilot);
  if (!areas.length) continue;
  const catalog = read(country.catalog);
  const kept = new Map(catalog.systems.filter(s => s.rydeAppArea).map(s => [s.id, s]));
  catalog.systems = catalog.systems.filter(s => !s.rydeAppArea);
  const additions = [];
  for (const area of areas) {
    if (!area.geometryEvidence || !area.rings.length) throw new Error(`Missing Ryde geometry: ${area.id}`);
    const localId = area.id.replace(new RegExp(`^${country.code.toLowerCase()}-`), '').replaceAll('-', '_');
    const id = `ryde_app_${country.code.toLowerCase()}_${localId}`;
    const computed = limeAreaGrid(area.rings, area.cellM);
    const previous = kept.get(id)?.rydeMapGrid;
    const grid = previous && previous.cells === computed.cells &&
      ['south','west','north','east','latStep'].every(k => previous[k] === computed[k]) &&
      Math.abs(previous.lngStep - computed.lngStep) <= 2 * Number.EPSILON * computed.lngStep ? previous : computed;
    const tiles = limeAreaTiles(area.rings, area.cellM);
    const contains = (b, p) => p[0] >= b.south && p[0] <= b.north && p[1] >= b.west && p[1] <= b.east;
    // Some official city centres lie just outside the operator's actual coverage.
    // The search result should open the nearest collected view in that city.
    const center = tiles.some(b => contains(b, area.center)) ? area.center : tiles.map(b => [Math.round((b.south+b.north)/2*1e8)/1e8,Math.round((b.west+b.east)/2*1e8)/1e8])
      .sort((a,b) => Math.hypot(a[0]-area.center[0],(a[1]-area.center[1])*Math.cos(area.center[0]*Math.PI/180)) -
        Math.hypot(b[0]-area.center[0],(b[1]-area.center[1])*Math.cos(area.center[0]*Math.PI/180)))[0];
    additions.push({ id, provider: 'ryde', city: area.city, center, bounds: area.bounds,
      discoveryUrl: 'https://api.ryde.vip/appRyde/getNearScootersNew', rydeAppArea: area.id, rydeMapGrid: grid });
  }
  const limeAt = catalog.systems.findIndex(s => s.limeAppMap);
  catalog.systems.splice(limeAt < 0 ? catalog.systems.length : limeAt, 0, ...additions);
  catalog.rydeVerifiedOn = '2026-11-04';
  catalog.rydeSource = 'https://www.ryde-technology.com/Locations';
  const output = JSON.stringify(catalog, null, 2) + '\n';
  const file = new URL(country.catalog, root);
  if (process.argv.includes('--check')) {
    if (readFileSync(file, 'utf8') !== output) throw new Error(`${country.catalog} differs; run npm run generate:providers`);
  } else writeFileSync(file, output);
}
