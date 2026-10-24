import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';
import { limeAppCatalogs, limeAuditFingerprint } from './lime-app-catalog.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const compiled = await build({ entryPoints: [new URL('server/limeAreas.ts', root).pathname],
  bundle: true, platform: 'node', format: 'esm', write: false });
const geometry = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const catalogs = limeAppCatalogs(read('data/lime-app-regions.json'), read('data/countries.json').countries,
  path => existsSync(new URL(path, root)) ? read(path) : undefined, geometry);
for (const [path, catalog] of catalogs) {
  const output = JSON.stringify(catalog, null, 2) + '\n';
  const file = new URL(path, root);
  if (process.argv.includes('--check')) {
    if (readFileSync(file, 'utf8') !== output) throw new Error(`${path} differs; run npm run generate:providers`);
  } else writeFileSync(file, output);
}

if (process.argv.includes('--check')) {
  const source = read('data/lime-app-regions.json');
  const audit = read('data/lime-app-audit.json');
  for (const market of source.markets) {
    const country = read('data/countries.json').countries.find(c => c.code === market.country);
    const systems = read(country.catalog).systems.filter(s => s.limeAppRegion === market.regionToken).flatMap(geometry.limeGridGroups);
    const cells = systems.reduce((count, system) => count + system.limeMapTiles.length, 0);
    const verified = audit.markets.find(row => row.regionToken === market.regionToken && row.country === market.country);
    if (!verified || verified.fingerprint !== limeAuditFingerprint(geometry.LIME_MAP_PROTOCOL, market, systems) ||
      verified.groups !== systems.length || verified.localCells !== cells ||
      verified.missingStationaryReferences !== 0 || !(verified.stationaryReferences > 0) || !(verified.scooters > 0) ||
      !Number.isInteger(verified.warmMapRequests) || verified.warmMapRequests < cells) {
      throw new Error(`${market.city} needs a successful full-area audit for this query grid`);
    }
  }
  const warmViews = audit.markets.reduce((count, market) => count + market.warmMapRequests, 0);
  if (!Number.isFinite(warmViews) || warmViews * geometry.LIME_QUERY_INTERVAL_MS >= geometry.LIME_IDLE_INTERVAL_MS) {
    throw new Error('The verified Lime inventory exceeds its idle request budget');
  }
}
