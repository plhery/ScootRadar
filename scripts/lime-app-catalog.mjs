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
 * and its town's seasonal pause where a standing rule sets one, as Laval's by-law.
 */
export function limeAppCatalogs(source, countries, readCatalog, geometry) {
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
      kept.set(country.catalog, new Map((previous?.systems ?? []).filter(s => s.limeAppMap).map(s => [s.id, s.limeMapGrid])));
      catalog = { ...(previous ?? { catalogSource: 'https://www.li.me/locations' }),
        verifiedOn: previous?.verifiedOn > source.verifiedOn ? previous.verifiedOn : source.verifiedOn,
        limeVerifiedOn: source.verifiedOn, limeServiceAreaSources: [], systems: (previous?.systems ?? []).filter(s => !s.limeAppMap) };
    }
    catalog.limeServiceAreaSources.push(...market.sourceDocuments);
    const previousGrid = kept.get(country.catalog).get(id);
    const grid = sameGrid(previousGrid, computed) ? previousGrid : computed;
    catalog.systems.push({ id,
      provider: 'lime', city: market.city, ...(market.region ? { region: market.region } : {}), center: market.center,
      ...(market.aliases?.length ? { aliases: market.aliases } : {}),
      timeZone: market.timeZone, discoveryUrl: 'https://web-production.lime.bike/api/rider/v2/map/bike_pins',
      ...(market.seasonal ? { seasonal: market.seasonal } : {}),
      limeAppMap: true, limeAppRegion: market.regionToken, limeMapGrid: grid });
    catalog.limeServiceAreaSources = [...new Set(catalog.limeServiceAreaSources)];
    catalogs.set(country.catalog, catalog);
  }
  return catalogs;
}

/** The live audit binds the query strategy and complete grid; names and credits do not alter it. */
export function limeAuditFingerprint(protocol, market, systems) {
  return createHash('sha256').update(JSON.stringify({ protocol, country: market.country, region: market.regionToken,
    polygons: market.serviceAreas.map(area => area.polygon), groups: systems.map(system => system.limeMapTiles) })).digest('hex');
}
