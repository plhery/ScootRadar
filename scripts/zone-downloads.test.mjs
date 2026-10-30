import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { swiftZoneDownloads, ZONE_DOWNLOAD_DIRECTORY, ZONE_DOWNLOAD_FORMAT, zoneDownloadFile, zoneDownloadFiles } from './zone-downloads.mjs';

const source = { title: 'Berlin, "E-Tretroller"', url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/' };
const berlin = {
  id: 'berlin', place: 'Berlin', country: 'DE', authority: 'Land Berlin, DL-DE Zero', timeZone: 'Europe/Berlin', source,
  map: { title: 'Geoportal Berlin', url: 'https://gdi.berlin.de/' }, layers: [], download: true,
  bounds: { south: 52.5, west: 13.3, north: 52.6, east: 13.5 },
  zones: [
    { id: 'berlin-no-parking-1', kind: 'noParking', name: 'Tiergarten', ring: [[52.51, 13.35], [52.52, 13.35], [52.52, 13.36]] },
    { id: 'berlin-parking-2', kind: 'parking', name: 'Berlin', ring: [[52.5, 13.4], [52.5001, 13.4], [52.5001, 13.4001], [52.5, 13.4001]] },
  ],
};
const hamburg = { ...berlin, id: 'hamburg', place: 'Hamburg', zones: [{ id: 'hamburg-slow-3', kind: 'slow', name: 'Hamburg', ring: [[53.55, 10], [53.56, 10], [53.56, 10.01]] }] };

describe('the zones the apps download', () => {
  it('writes a city\'s zones one a line, each ring flat, without their names', () => {
    const file = zoneDownloadFile(berlin);
    expect(file).toBe('{"id":"berlin","zones":[\n'
      + '{"id":"berlin-no-parking-1","kind":"noParking","ring":[52.51,13.35,52.52,13.35,52.52,13.36]},\n'
      + '{"id":"berlin-parking-2","kind":"parking","ring":[52.5,13.4,52.5001,13.4,52.5001,13.4001,52.5,13.4001]}\n]}\n');
    expect(JSON.parse(file).zones.map(zone => zone.ring.length)).toEqual([6, 8]);
  });

  it('lists each city in the index with what an app needs before its file, and the file\'s size and SHA-256', () => {
    const files = zoneDownloadFiles([berlin, hamburg]);
    expect(Object.keys(files)).toEqual(['berlin.json', 'hamburg.json', 'index.json']);
    const index = JSON.parse(files['index.json']);
    expect(index.format).toBe(ZONE_DOWNLOAD_FORMAT);
    expect(index.cities.map(city => city.id)).toEqual(['berlin', 'hamburg']);
    expect(index.cities[0]).toEqual({
      id: 'berlin', place: 'Berlin', authority: 'Land Berlin, DL-DE Zero', timeZone: 'Europe/Berlin', source,
      bounds: berlin.bounds, zones: 2, bytes: Buffer.byteLength(files['berlin.json']),
      sha256: createHash('sha256').update(files['berlin.json']).digest('hex'),
    });
    // One city a line, so that a change to one reads as one line.
    expect(files['index.json'].split('\n')).toHaveLength(5);
    expect(zoneDownloadFiles([])).toEqual({ 'index.json': '{"format":1,"cities":[]}\n' });
  });

  it('builds the download cities into the iPhone app, and names the cities built in', () => {
    const swift = swiftZoneDownloads([berlin], [{ id: 'bergen' }, { id: 'porto' }]);
    expect(swift).toContain('            id: "berlin", place: "Berlin", authority: "Land Berlin, DL-DE Zero",\n');
    expect(swift).toContain(`source: URL(string: "${source.url}")!,\n`);
    expect(swift).toContain('bounds: GeoBounds(south: 52.5, west: 13.3, north: 52.6, east: 13.5)\n');
    expect(swift).toContain('static let builtInCities: Set<String> = ["bergen", "porto"]');
    expect(swiftZoneDownloads([], [])).toContain('static let builtIn: [CityZoneDownload] = []\n');
  });

  it('publishes the cities data/city-zones.json marks download, and no other file', () => {
    const cities = JSON.parse(readFileSync('data/city-zones.json', 'utf8')).cities;
    const downloads = cities.filter(city => city.download).map(city => city.id);
    const index = JSON.parse(readFileSync(`${ZONE_DOWNLOAD_DIRECTORY}/index.json`, 'utf8'));
    expect(index.cities.map(city => city.id)).toEqual(downloads);
    expect(readdirSync(ZONE_DOWNLOAD_DIRECTORY).sort()).toEqual([...downloads.map(id => `${id}.json`), 'index.json'].sort());
    for (const city of index.cities) {
      const file = readFileSync(`${ZONE_DOWNLOAD_DIRECTORY}/${city.id}.json`);
      expect(createHash('sha256').update(file).digest('hex'), city.id).toBe(city.sha256);
      expect(file.length, city.id).toBe(city.bytes);
      expect(JSON.parse(file.toString('utf8')).zones, city.id).toHaveLength(city.zones);
    }
  });
});
