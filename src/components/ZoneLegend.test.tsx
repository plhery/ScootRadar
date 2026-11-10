// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import ZoneLegend, { formatSpeedLimits } from '@/components/ZoneLegend';
import { CITY_ZONE_FILES, cityRuleZones, ZONE_CITIES } from '@/lib/cityZones';
import { I18nProvider } from '@/lib/i18n';
import { ruleZonesInView, type RuleKind, type RuleZoneShape } from '@/lib/ruleZones';

const SEOUL_NOON = Date.parse('2026-10-26T03:00:00Z');
const HONGDAE = { south: 37.55, west: 126.918, north: 37.558, east: 126.93 };
const SAKAE = { south: 35.165, west: 136.903, north: 35.173, east: 136.915 };
const STORTORGET = { south: 56.044, west: 12.69, north: 56.049, east: 12.7 };
// Linköping's Stora torget and the streets off it, where the kommun sets 6 km/h; Gävle's Drottninggatan, where it sets no speed.
const STORA_TORGET = { south: 58.4098, west: 15.62, north: 58.411, east: 15.6225 };
const DROTTNINGGATAN = { south: 60.6741, west: 17.1428, north: 60.6751, east: 17.1444 };
const NOVEMBER = Date.parse('2026-11-03T12:00:00Z');
const SOURCE = { title: 'Bergen kommune, "Elsparkesykler i Bergen"', url: 'https://www.bergen.kommune.no/elsparkesykler' };

function bergen(id: string, rule: RuleKind): RuleZoneShape {
  return {
    id, place: id, authority: 'Bergen kommune', rule, timeZone: 'Europe/Oslo', source: SOURCE,
    ring: [[60.395, 5.324], [60.395, 5.326], [60.396, 5.326]], polygons: [], inForce: true,
  };
}

/** One of Bergen's slow zones, made up: its limit, if it has one, its hours, if any, and whether it holds now. */
function bergenSlow(id: string, maxSpeedKph: number | undefined, hours?: { from: string; until: string }[], inForce = true): RuleZoneShape {
  return { ...bergen(id, 'slow'), maxSpeedKph, hours, inForce };
}

beforeEach(() => {
  localStorage.setItem('scooters-locale', 'en');
  localStorage.removeItem('scooters-units');
});

/** What the legend lists, item by item, and its credit. */
function listed(container: HTMLElement) {
  return {
    items: [...container.querySelectorAll('.zone-legend-item')].map(item => item.textContent),
    credit: container.querySelector('.zone-legend-credit')?.textContent,
  };
}

it('says there are none only of an area whose zones are all known, and to zoom in where some were left out', () => {
  const note = (container: HTMLElement) => container.querySelector('.zone-legend-note')?.textContent;
  const { container, rerender } = render(<I18nProvider><ZoneLegend state="shown" zones={[]} /></I18nProvider>);
  expect(note(container)).toBe('No zones published here');
  // Unknown rules are not no rules.
  rerender(<I18nProvider><ZoneLegend state="failed" zones={[]} /></I18nProvider>);
  expect(note(container)).toBe('Zones unavailable right now');
  rerender(<I18nProvider><ZoneLegend state="loading" zones={[]} /></I18nProvider>);
  expect(note(container)).toBeUndefined();
  // Those drawn are named still.
  rerender(<I18nProvider><ZoneLegend state="partial" zones={[{ kind: 'noRide' }]} /></I18nProvider>);
  expect(note(container)).toBe('Zoom in to see the zones');
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow']);
});

it('names the kinds of the zones drawn where those of one feed could not be read, and says the zones are unavailable', () => {
  const drawn = [{ kind: 'noRide' as const }, { kind: 'noParking' as const }, { kind: 'slow' as const, maxSpeedKph: 5 }];
  const { container } = render(<I18nProvider><ZoneLegend state="failed" zones={drawn} /></I18nProvider>);
  expect(container.querySelector('.zone-legend-note')?.textContent).toBe('Zones unavailable right now');
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow: 5 km/h']);
});

it('names each of a city\'s kinds once, the strongest first, and credits the city once, linked to where it says so', () => {
  const rules = [
    bergen('parking-1', 'parking'), bergen('no-parking-1', 'noParking'), bergen('slow-1', 'slow'),
    bergen('no-parking-2', 'noParking'), bergen('no-ride-1', 'noRide'),
  ];
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['No riding', 'No parking', 'Slow', 'Parking'], credit: 'Bergen kommune' });
  expect([...container.querySelectorAll('.zone-legend-item .zone-swatch')].map(swatch => swatch.className))
    .toEqual(['noRide', 'noParking', 'slow', 'parking'].map(kind => `zone-swatch zone-swatch-${kind}`));
  expect(container.querySelectorAll('.zone-legend-rule')).toHaveLength(0);
  expect(screen.getByRole('link', { name: 'Bergen kommune' }).getAttribute('href')).toBe(SOURCE.url);
});

it('names a kind the operators and a city both set once, gives a street a line for its hours, and credits each city once', () => {
  const rules = [
    bergen('parking-1', 'parking'), bergen('no-ride-1', 'noRide'),
    ...ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, SEOUL_NOON),
  ];
  const { container } = render(<I18nProvider><ZoneLegend state="shown" zones={[{ kind: 'noRide' }, { kind: 'noParking' }]} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({
    items: ['No riding', 'No parking', 'Slow', 'Parking', 'No riding 12:00–23:00'],
    credit: 'Bergen kommune · Seoul, lines © OpenStreetMap',
  });
  expect(container.querySelector('.zone-legend-rule')!.getAttribute('data-in-force')).toBe('true');
  // Hatched the other way, as the map draws a rule with hours.
  expect(container.querySelector('.zone-legend-rule .zone-swatch')!.className).toBe('zone-swatch zone-swatch-noRide zone-swatch-timed');
});

it('says when a street\'s rule does not hold now, and still names its kind and who sets it', () => {
  const evening = Date.parse('2026-10-26T15:00:00Z');
  const rules = ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, evening);
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['No riding 12:00–23:00 (not now)'], credit: 'Seoul, lines © OpenStreetMap' });
  expect(container.querySelector('.zone-legend-rule')!.getAttribute('data-in-force')).toBe('false');
});

it('names Nagoya\'s pavements once, a line for a swatch, credited to the rules with JARTIC\'s credit', async () => {
  const nagoya = ZONE_CITIES.find(city => city.id === 'nagoya')!;
  const { default: file } = await CITY_ZONE_FILES.nagoya();
  const rules = ruleZonesInView({ bounds: SAKAE, zoom: 16 }, Date.now(), cityRuleZones(nagoya, file));
  expect(rules.length).toBeGreaterThan(10);
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['Pavement riding at 6 km/h'], credit: 'Aichi police, data JARTIC' });
  expect(container.querySelector('.zone-legend-item .zone-swatch')!.className).toBe('zone-swatch zone-swatch-pavement');
  const link = screen.getByRole('link', { name: 'Aichi police, data JARTIC' });
  expect(link.getAttribute('href')).toBe('https://www.npa.go.jp/bureau/traffic/anzen/tokuteikogata.html');
  expect(link.getAttribute('title')).toMatch(/6 km\/h.*出典：「交通規制情報」（https:\/\/www\.jartic\.or\.jp\/service\/opendata\/）（公益財団法人日本道路交通情報センター）を加工して作成$/);
});

it('names central Helsingborg\'s rule, racks or marked places only, credited to the city and linked to the rule in Transportstyrelsen\'s register', async () => {
  const helsingborg = ZONE_CITIES.find(city => city.id === 'helsingborg')!;
  const { default: file } = await CITY_ZONE_FILES.helsingborg();
  const rules = ruleZonesInView({ bounds: STORTORGET, zoom: 16 }, Date.now(), cityRuleZones(helsingborg, file));
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['Park only in racks or marked places'], credit: 'Helsingborgs stad' });
  expect(container.querySelector('.zone-legend-item .zone-swatch')!.className).toBe('zone-swatch zone-swatch-racksOnly');
  expect(screen.getByRole('link', { name: 'Helsingborgs stad' }).getAttribute('href')).toBe(helsingborg.source.url);
});

it('says the limit of the slow zones it counts, the operators\' and a city\'s, once where they round to one', () => {
  const linkoping = ruleZonesInView({ bounds: STORA_TORGET, zoom: 16 }, NOVEMBER);
  expect(linkoping.length).toBeGreaterThan(1);
  expect(linkoping.every(zone => zone.rule === 'slow' && zone.maxSpeedKph === 6 && zone.inForce)).toBe(true);
  // The city's alone, the operators' zones off.
  const { container, rerender } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={linkoping} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['Slow: 6 km/h'], credit: 'Linköpings kommun, lines © OpenStreetMap' });
  // With the operators': 6.4 km/h is 6 too. Their other kinds have no limit to say.
  const zones = [{ kind: 'noRide' as const }, { kind: 'slow' as const, maxSpeedKph: 6 }, { kind: 'slow' as const, maxSpeedKph: 6.4 }];
  rerender(<I18nProvider><ZoneLegend state="shown" zones={zones} rules={linkoping} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow: 6 km/h']);
  // The operators' alone, as screen readers read it.
  rerender(<I18nProvider><ZoneLegend state="shown" zones={zones} /></I18nProvider>);
  expect(screen.getByRole('group', { name: 'Zones' }).textContent).toBe('No ridingNo parkingSlow: 6 km/h');
});

it('says the least and the greatest limit where they differ', () => {
  const linkoping = ruleZonesInView({ bounds: STORA_TORGET, zoom: 16 }, NOVEMBER);
  const zones = [{ kind: 'slow' as const, maxSpeedKph: 15 }, { kind: 'slow' as const, maxSpeedKph: 10 }];
  const { container } = render(<I18nProvider><ZoneLegend state="shown" zones={zones} rules={linkoping} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow: 6–15 km/h']);
});

it('says Slow alone where one of the slow zones it counts has no limit, or there is none', () => {
  const gavle = ruleZonesInView({ bounds: DROTTNINGGATAN, zoom: 16 }, NOVEMBER);
  expect(gavle.map(({ id, maxSpeedKph }) => ({ id, maxSpeedKph }))).toEqual([{ id: 'gavle-drottninggatan', maxSpeedKph: undefined }]);
  const { container, rerender } = render(
    <I18nProvider><ZoneLegend state="shown" zones={[{ kind: 'slow', maxSpeedKph: 10 }]} rules={gavle} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow']);
  // An operator's slow zone without one.
  rerender(<I18nProvider><ZoneLegend state="shown" zones={[{ kind: 'slow', maxSpeedKph: 10 }, { kind: 'slow' }]} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow']);
  // No slow zone among the operators': their kinds are named all the same.
  rerender(<I18nProvider><ZoneLegend state="shown" zones={[{ kind: 'noParking' }]} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow']);
  // Further out, the note stands for the operators' kinds, and their limits go with them.
  rerender(<I18nProvider><ZoneLegend state="zoomIn" zones={[{ kind: 'slow', maxSpeedKph: 10 }]} rules={[bergenSlow('slow-1', 6)]} /></I18nProvider>);
  expect(listed(container).items).toEqual(['Slow: 6 km/h']);
});

it('gives a city\'s slow line, for its hours or as it does not hold yet, the limit of its own zones', () => {
  const night = [{ from: '22:00', until: '06:00' }];
  const rules = [
    bergenSlow('slow-night-1', 12, night), bergenSlow('slow-night-2', 15, night),
    bergenSlow('slow-morning', undefined, [{ from: '07:00', until: '09:00' }]),
    bergenSlow('slow-later', 12, undefined, false),
    bergenSlow('slow-1', 6),
  ];
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  expect(listed(container).items).toEqual([
    'Slow: 6 km/h', 'Slow: 12–15 km/h 22:00–06:00', 'Slow 07:00–09:00', 'Slow: 12 km/h (not now)',
  ]);
});

it('names the limits of the slow zones on screen only, not of those in the area around it the zones are asked for', () => {
  // The screen over Bergen's made-up zones, and the area asked for around it, which reaches 60.403° north.
  const screen = { south: 60.394, west: 5.322, north: 60.398, east: 5.328 };
  const north = (ring: [number, number][]) => ring.map(([lat, lng]): [number, number] => [lat + 0.006, lng]);
  const onScreen = bergenSlow('slow-1', 6);
  const offScreen: RuleZoneShape = { ...bergenSlow('slow-2', 15), ring: north(onScreen.ring!), lines: undefined };
  const night = [{ from: '22:00', until: '06:00' }];
  const nightOn = bergenSlow('slow-night-1', 12, night);
  const nightOff: RuleZoneShape = { ...bergenSlow('slow-night-2', 20, night), ring: north(nightOn.ring!), lines: undefined };
  const operator = (maxSpeedKph: number | undefined, ring: [number, number][]) => ({ kind: 'slow' as const, maxSpeedKph, polygons: [[ring]] });
  // One of an operator's on screen at 10 km/h, and in the area around it one at 25 km/h and one without a limit.
  const zones = [operator(10, onScreen.ring!), operator(25, north(onScreen.ring!)), operator(undefined, north(onScreen.ring!))];
  const rules = [onScreen, offScreen, nightOn, nightOff];
  const { container, rerender } = render(<I18nProvider><ZoneLegend state="shown" zones={zones} rules={rules} view={screen} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow: 6–10 km/h', 'Slow: 12 km/h 22:00–06:00']);
  // Panned over the others, they are named.
  rerender(<I18nProvider><ZoneLegend state="shown" zones={zones.slice(0, 2)} rules={rules} view={{ ...screen, north: 60.403 }} /></I18nProvider>);
  expect(listed(container).items).toEqual(['No riding', 'No parking', 'Slow: 6–25 km/h', 'Slow: 12–20 km/h 22:00–06:00']);
});

it('says the limits in mph where the region measures in miles', async () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);
  const zones = [{ kind: 'slow' as const, maxSpeedKph: 16.09 }, { kind: 'slow' as const, maxSpeedKph: 12.87 }];
  const rules = [bergenSlow('slow-night', 16, [{ from: '22:00', until: '06:00' }])];
  const { container } = render(<I18nProvider><ZoneLegend state="shown" zones={zones} rules={rules} /></I18nProvider>);
  await vi.waitFor(() => expect(listed(container).items).toEqual([
    'No riding', 'No parking', 'Slow: 8–10 mph', 'Slow: 10 mph 10:00 PM–6:00 AM',
  ]));
});

it('says the limits, and the pavement\'s walking pace, in the units chosen over the region\'s', async () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-CH']);
  localStorage.setItem('scooters-units', 'imperial');
  const rules = [bergenSlow('slow-1', 16.09), bergen('pavement', 'pavement')];
  const { container } = render(<I18nProvider><ZoneLegend state="off" zones={[]} rules={rules} /></I18nProvider>);
  await vi.waitFor(() => expect(listed(container).items).toEqual(['Slow: 10 mph', 'Pavement riding at 4 mph']));
});

it('writes a limit in the units chosen: Automatic as the region does, else kilometres or miles anywhere', () => {
  expect(formatSpeedLimits([16.09], 'en', 'US', 'auto')).toBe('10 mph');
  expect(formatSpeedLimits([16.09], 'en', 'US', 'metric')).toBe('16 km/h');
  expect(formatSpeedLimits([16.09], 'en', 'CH', 'imperial')).toBe('10 mph');
  expect(formatSpeedLimits([16.09], 'en', 'GB', 'imperial')).toBe('10 mph');
  expect(formatSpeedLimits([16.09], 'en', 'GB', 'metric')).toBe('16 km/h');
  expect(formatSpeedLimits([6, 15], 'de', 'CH', 'imperial')).toBe('4–9 mi/h');
});

it('writes a limit in the language, as its region writes it, and in miles where it measures in them', () => {
  expect(formatSpeedLimits([6], 'en', 'CH')).toBe('6 km/h');
  expect(formatSpeedLimits([6, 15, 12], 'en', 'CH')).toBe('6–15 km/h');
  // Rounded once converted, to one where the least and the greatest round alike.
  expect(formatSpeedLimits([16.09, 12.87], 'en', 'US')).toBe('8–10 mph');
  expect(formatSpeedLimits([16, 16.1], 'en', 'GB')).toBe('10 mph');
  expect(formatSpeedLimits([16, 16.1], 'en', 'CH')).toBe('16 km/h');
  expect(formatSpeedLimits([20], 'en', 'LR')).toBe('12 mph');
  expect(formatSpeedLimits([20], 'en', 'MM')).toBe('12 mph');
  expect(formatSpeedLimits([6, 15], 'nl', 'NL')).toBe('6–15 km/u');
  expect(formatSpeedLimits([6, 15], 'nb', 'NO')).toBe('6–15 km/t');
  expect(formatSpeedLimits([6], 'is', 'IS')).toBe('6 km/klst.');
  // French sets a narrow space before the unit.
  expect(formatSpeedLimits([6], 'fr', 'US')).toBe('4\u202Fmi/h');
  // None to say.
  expect(formatSpeedLimits([], 'en', 'CH')).toBeNull();
  expect(formatSpeedLimits([6, undefined], 'en', 'CH')).toBeNull();
});

it('says the limit in each language with the kind\'s own name', async () => {
  for (const [language, said] of [
    ['de', 'Langsam: 6–15 km/h'], ['fr', 'Vitesse réduite : 6–15 km/h'], ['it', 'Velocità ridotta: 6–15 km/h'],
    ['nl', 'Langzaam: 6–15 km/u'], ['nb', 'Lav fart: 6–15 km/t'], ['pt', 'Velocidade reduzida: 6–15 km/h'],
    ['es', 'Velocidad reducida: 6–15 km/h'], ['is', 'Hægur akstur: 6–15 km/klst.'],
  ]) {
    localStorage.setItem('scooters-locale', language);
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([`${language}-CH`]);
    const { container, unmount } = render(
      <I18nProvider><ZoneLegend state="off" zones={[]} rules={[bergenSlow('slow-1', 6), bergenSlow('slow-2', 15)]} /></I18nProvider>);
    await vi.waitFor(() => expect(listed(container).items.map(item => item?.replace(/\s/g, ' '))).toEqual([said]));
    unmount();
  }
});
