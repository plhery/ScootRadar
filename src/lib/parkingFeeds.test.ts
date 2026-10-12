import { expect, it, vi } from 'vitest';
import { fetchRegionalParking } from './parkingFeeds';
import { fetchJson } from './scooterFeeds';
import { FRENCH_SCOOTER_SYSTEMS } from './frenchScooterSystems';
const system = FRENCH_SCOOTER_SYSTEMS.find(system => system.id === 'dott_fr_lyon')!;
vi.mock('./scooterFeeds', async importOriginal => ({ ...await importOriginal<typeof import('./scooterFeeds')>(), fetchJson: vi.fn() }));

it('applies a parking rule that starts and ends within the hour of unchanged metadata', async () => {
  const base = new URL('.', system.discoveryUrl).toString();
  const square = [[4.8, 45.7], [4.9, 45.7], [4.9, 45.8], [4.8, 45.8], [4.8, 45.7]];
  const documents: Record<string, unknown> = {
    [system.discoveryUrl]: { data: { feeds: ['station_information', 'vehicle_types', 'geofencing_zones']
      .map(name => ({ name, url: `${base}${name}.json` })) } },
    [`${base}station_information.json`]: { data: { stations: [{ station_id: 'bay', lat: 45.75, lon: 4.85, is_virtual_station: true }] } },
    [`${base}vehicle_types.json`]: { data: { vehicle_types: [
      { vehicle_type_id: 'scooter', form_factor: 'scooter_standing', propulsion_type: 'electric' }] } },
    [`${base}geofencing_zones.json`]: { data: { geofencing_zones: { features: [{ geometry: { type: 'Polygon', coordinates: [square] },
      properties: { start: '2026-10-12T12:15:00Z', end: '2026-10-12T12:30:00Z', rules: [{ station_parking: true }] } }] } } },
  };
  vi.mocked(fetchJson).mockImplementation(async url => ({ data: documents[url], stale: false, fetchedAt: Date.now() }));
  const mandatoryAt = async (time: string) => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(`2026-10-12T${time}:00Z`));
    return (await fetchRegionalParking(system)).locations[0].mandatory;
  };
  expect(await mandatoryAt('12:05')).toBe(false);
  expect(await mandatoryAt('12:20')).toBe(true);
  expect(await mandatoryAt('12:35')).toBe(false);
});
