import { describe, expect, it } from 'vitest';
import { COUNTRY_ATTRIBUTIONS } from '@/generated/countries';
import { skippedSources } from '@/lib/scooterSources';
import { DATA_CREDITS_URL, mobilitySource, scooterResponse, scooterResponseHeaders } from '@/lib/scooterResponse';
import type { ScooterResponse } from '@/lib/types';

function answer(fresh: string[], parking = false): ScooterResponse {
  const sources = { ...skippedSources(), ...Object.fromEntries(fresh.map(source => [source, 'fresh'])) };
  return {
    ...scooterResponse({ vehicles: [], meta: { partial: false, stale: false, failedSources: [], sources } }, 16),
    ...(parking ? { parking: [{ id: 'p1', provider: 'lime', name: 'Gare', lat: 50.63, lng: 3.06, mandatory: true }] } : {}),
  };
}

describe('X-Mobility-Data-Source', () => {
  it('names the countries whose data the answer holds, whole, and where every source is credited', () => {
    const zurich = scooterResponseHeaders(answer(['national', 'hopp']))['X-Mobility-Data-Source'];
    expect(zurich).toBe(`${COUNTRY_ATTRIBUTIONS.CH}; All sources and licences: ${DATA_CREDITS_URL}`);
    expect(zurich.length).toBeLessThan(400);
    const oslo = mobilitySource(answer(['norway']));
    expect(oslo).toContain('contains data under the Norwegian licence for Open Government data (NLOD) distributed by Entur AS');
    expect(oslo).not.toContain('Switzerland');
  });

  it('links the licences that ask for their text with the data: Beryl\'s CDLA-Permissive-2.0 in a British answer', () => {
    expect(mobilitySource(answer(['uk']))).toContain('Beryl GBFS, CDLA-Permissive-2.0 (https://cdla.dev/permissive-2-0/)');
    expect(mobilitySource(answer(['germany']))).toContain('dl-de/by-2-0 (https://www.govdata.de/dl-de/by-2-0)');
  });

  it('names Lille\'s parking where the answer has its bays', () => {
    expect(mobilitySource(answer(['france'], true))).toContain('Lille parking: Metropole Europeenne de Lille');
    expect(mobilitySource(answer(['france']))).not.toContain('Lille');
  });

  it('names every country for an answer made from all of them, in ASCII, as a header must be', () => {
    const all = mobilitySource(answer(Object.keys(skippedSources())));
    for (const attribution of Object.values(COUNTRY_ATTRIBUTIONS)) expect(all).toContain(attribution);
    expect(all).toContain("Linkoping's and Gavle's slow streets");
    expect(all).toMatch(/^[\x20-\x7e]*$/);
  });

  it('names none for an answer made from no feed, only where they are credited', () => {
    expect(mobilitySource(answer([]))).toBe(`All sources and licences: ${DATA_CREDITS_URL}`);
  });
});
