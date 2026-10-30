import { createHash } from 'node:crypto';

// The cities whose zones the apps download rather than have built in (docs/city-zone-downloads.md):
// each city's file and the index of them all, published by the website under /zones/v1/.

/** The format of the files under /zones/v1/: one an app of today could not read goes under /zones/v2/. */
export const ZONE_DOWNLOAD_FORMAT = 1;
export const ZONE_DOWNLOAD_DIRECTORY = 'public/zones/v1';

/** A city's file: its id, then its zones, one a line, each ring as latitude, longitude, latitude, longitude… */
export function zoneDownloadFile(city) {
  const zones = city.zones.map(zone => JSON.stringify({ id: zone.id, kind: zone.kind, ring: zone.ring.flat() }));
  return `{"id":${JSON.stringify(city.id)},"zones":[\n${zones.join(',\n')}\n]}\n`;
}

const sha256 = text => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * Every file to publish, by name: each city's, and index.json, which lists them with what an app needs
 * before it has a city's file, for the legend to name the city and link its source, and to check the file.
 */
export function zoneDownloadFiles(cities) {
  const files = {};
  const entries = cities.map(city => {
    const file = zoneDownloadFile(city);
    files[`${city.id}.json`] = file;
    return JSON.stringify({
      id: city.id, place: city.place, authority: city.authority, timeZone: city.timeZone,
      source: { title: city.source.title, url: city.source.url }, bounds: city.bounds,
      zones: city.zones.length, bytes: Buffer.byteLength(file, 'utf8'), sha256: sha256(file),
    });
  });
  files['index.json'] = `{"format":${ZONE_DOWNLOAD_FORMAT},"cities":[${entries.length ? `\n${entries.join(',\n')}\n` : ''}]}\n`;
  return files;
}

const swiftBounds = b => `GeoBounds(south: ${b.south}, west: ${b.west}, north: ${b.north}, east: ${b.east})`;

/**
 * The download cities as the iPhone app is built, so that a view over one says its zones are loading or
 * unavailable before the first index arrives, and the cities built in, whose entries in an index it leaves aside.
 */
export function swiftZoneDownloads(downloads, builtIn) {
  const cities = downloads.map(city => (
    `        CityZoneDownload(\n            id: ${JSON.stringify(city.id)}, place: ${JSON.stringify(city.place)}, authority: ${JSON.stringify(city.authority)},\n` +
    `            timeZone: ${JSON.stringify(city.timeZone)}, source: URL(string: ${JSON.stringify(city.source.url)})!,\n` +
    `            bounds: ${swiftBounds(city.bounds)}\n        ),`
  ));
  return `
/// The cities whose zones the app downloads (docs/city-zone-downloads.md), as data/city-zones.json had them when
/// the app was built, and the cities whose zones are built in.
extension CityZoneDownloads {
    static let builtIn: [CityZoneDownload] = [${cities.length ? `\n${cities.join('\n')}\n    ` : ''}]

    static let builtInCities: Set<String> = [${builtIn.map(city => JSON.stringify(city.id)).join(', ')}]
}
`;
}
