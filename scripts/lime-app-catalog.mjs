import { createHash } from 'node:crypto';

const round = value => Math.round(value * 1e8) / 1e8;
const slug = name => name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

/** Reviewed service polygons own app groups; public GBFS entries remain untouched. */
export function limeAppCatalogs(source, countries, readCatalog, geometry) {
  const catalogs = new Map();
  for (const market of source.markets) {
    const country = countries.find(c => c.code === market.country);
    if (!country?.catalog) throw new Error(`No country catalog for Lime ${market.country}`);
    const outlines = market.serviceAreas.map(area => geometry.decodeLimeArea(area.polygon));
    const tiles = geometry.limeAreaTiles(outlines).map(box => Object.fromEntries(Object.entries(box).map(([key, value]) => [key, round(value)])));
    let catalog = catalogs.get(country.catalog);
    if (!catalog) {
      const previous = readCatalog(country.catalog);
      catalog = { ...(previous ?? { catalogSource: 'https://www.li.me/locations' }),
        verifiedOn: previous?.verifiedOn > source.verifiedOn ? previous.verifiedOn : source.verifiedOn,
        limeVerifiedOn: source.verifiedOn, limeServiceAreaSources: [], systems: (previous?.systems ?? []).filter(s => !s.limeAppMap) };
    }
    catalog.limeServiceAreaSources.push(...market.sourceDocuments);
    // A street view wakes nearby groups rather than a full-city scan.
    const groupSize = geometry.LIME_TILE_GROUP_SIZE;
    for (let i = 0; i < tiles.length; i += groupSize) {
      const group = tiles.slice(i, i + groupSize);
      catalog.systems.push({ id: `lime_${market.country.toLowerCase()}_app_${slug(market.city)}_${String(i / groupSize).padStart(3, '0')}`,
        provider: 'lime', city: market.city, center: market.center,
        ...(market.aliases?.length ? { aliases: market.aliases } : {}),
        bounds: { south: Math.min(...group.map(b => b.south)), north: Math.max(...group.map(b => b.north)),
          west: Math.min(...group.map(b => b.west)), east: Math.max(...group.map(b => b.east)) },
        timeZone: market.timeZone, discoveryUrl: 'https://web-production.lime.bike/api/rider/v2/map/bike_pins',
        limeAppMap: true, limeAppRegion: market.regionToken, limeMapTiles: group });
    }
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
