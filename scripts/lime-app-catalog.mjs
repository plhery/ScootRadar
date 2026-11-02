import { createHash } from 'node:crypto';

const slug = name => name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

// Math.cos can round its last bit differently on another processor: Node 26 gives Langenfeld's
// column step one bit apart on arm64 and x64. A grid computed again keeps the catalog's when only
// that differs, so the catalog, and the audit of its tiles, read the same everywhere.
const sameGrid = (kept, grid) => kept && kept.cells === grid.cells &&
  ['south', 'west', 'north', 'east', 'latStep'].every(key => kept[key] === grid[key]) &&
  Math.abs(kept.lngStep - grid.lngStep) <= 2 * Number.EPSILON * grid.lngStep;

/**
 * Reviewed service polygons own app groups; public GBFS entries remain untouched. Each market is
 * one entry, its grid of local views, which src/lib/limeGrid.ts splits into the refresh groups,
 * its town's seasonal pause where a standing rule sets one, as Laval's by-law, and the other
 * towns its service area takes in that count on their own, as Garden City in Boise's.
 *
 * A market's entry is written from data/lime-app-regions.json alone, its grid aside: a key set on
 * it in the country's catalog, as a pause written into data/canadian-scooter-feeds.json, would be
 * lost, so it stops the generator, which says where the key goes. A value that changes, or an
 * entry whose market is gone, is told through `warn`.
 */
export function limeAppCatalogs(source, countries, readCatalog, geometry, warn = message => console.warn(message)) {
  const catalogs = new Map(), kept = new Map();
  for (const market of source.markets) {
    const country = countries.find(c => c.code === market.country);
    if (!country?.catalog) throw new Error(`No country catalog for Lime ${market.country}`);
    const computed = geometry.limeAreaGrid(market.serviceAreas.map(area => geometry.decodeLimeArea(area.polygon)));
    if (!computed.cells) throw new Error(`Lime ${market.city} has no local view`);
    const id = `lime_${market.country.toLowerCase()}_app_${slug(market.city)}`;
    let catalog = catalogs.get(country.catalog);
    if (!catalog) {
      const previous = readCatalog(country.catalog);
      kept.set(country.catalog, new Map((previous?.systems ?? []).filter(s => s.limeAppMap).map(s => [s.id, s])));
      catalog = { ...(previous ?? { catalogSource: 'https://www.li.me/locations' }),
        verifiedOn: previous?.verifiedOn > source.verifiedOn ? previous.verifiedOn : source.verifiedOn,
        limeVerifiedOn: source.verifiedOn, limeServiceAreaSources: [], systems: (previous?.systems ?? []).filter(s => !s.limeAppMap) };
    }
    catalog.limeServiceAreaSources.push(...market.sourceDocuments);
    const before = kept.get(country.catalog).get(id);
    const previousGrid = before?.limeMapGrid;
    const grid = sameGrid(previousGrid, computed) ? previousGrid : computed;
    const system = { id,
      provider: 'lime', city: market.city, ...(market.region ? { region: market.region } : {}), center: market.center,
      ...(market.aliases?.length ? { aliases: market.aliases } : {}),
      ...(market.towns?.length ? { towns: market.towns } : {}),
      timeZone: market.timeZone, discoveryUrl: 'https://web-production.lime.bike/api/rider/v2/map/bike_pins',
      ...(market.seasonal ? { seasonal: market.seasonal } : {}),
      limeAppMap: true, limeAppRegion: market.regionToken, limeMapGrid: grid };
    if (before) compareWithCatalog(country.catalog, before, system, warn);
    catalog.systems.push(system);
    catalog.limeServiceAreaSources = [...new Set(catalog.limeServiceAreaSources)];
    catalogs.set(country.catalog, catalog);
  }
  for (const [path, systems] of kept) {
    const written = new Set(catalogs.get(path).systems.map(system => system.id));
    for (const id of systems.keys()) {
      if (!written.has(id)) warn(`${path}: ${id} is no market of data/lime-app-regions.json, so it is left out`);
    }
  }
  return catalogs;
}

/** Stops on a key the catalog's entry holds and its market doesn't give; tells of a value that changes. */
function compareWithCatalog(path, before, system, warn) {
  const dropped = Object.keys(before).filter(key => !(key in system));
  if (dropped.length) {
    const keys = dropped.map(key => `"${key}"`).join(', ');
    throw new Error(`${path}: ${system.id} has ${keys}, which its market (${system.city}) in data/lime-app-regions.json ` +
      `doesn't give, so the generator would drop ${dropped.length > 1 ? 'them' : 'it'}. Set ${keys} on the market in ` +
      `data/lime-app-regions.json, or delete ${dropped.length > 1 ? 'them' : 'it'} from ${path} if meant to go.`);
  }
  for (const key of Object.keys(system)) {
    if (key === 'limeMapGrid' || !(key in before) || JSON.stringify(before[key]) === JSON.stringify(system[key])) continue;
    warn(`${path}: ${system.id}'s "${key}" becomes ${JSON.stringify(system[key])} from data/lime-app-regions.json ` +
      `(${JSON.stringify(before[key])} in the catalog)`);
  }
}

/** The live audit binds the query strategy and complete grid; names and credits do not alter it. */
export function limeAuditFingerprint(protocol, market, systems) {
  return createHash('sha256').update(JSON.stringify({ protocol, country: market.country, region: market.regionToken,
    polygons: market.serviceAreas.map(area => area.polygon), groups: systems.map(system => system.limeMapTiles) })).digest('hex');
}
