// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import ZoneLegend from '@/components/ZoneLegend';
import { CITY_ZONE_FILES, cityRuleZones, ZONE_CITIES } from '@/lib/cityZones';
import { I18nProvider } from '@/lib/i18n';
import { ruleZonesInView, type RuleKind, type RuleZoneShape } from '@/lib/ruleZones';

const SEOUL_NOON = Date.parse('2026-10-26T03:00:00Z');
const HONGDAE = { south: 37.55, west: 126.918, north: 37.558, east: 126.93 };
const SAKAE = { south: 35.165, west: 136.903, north: 35.173, east: 136.915 };
const STORTORGET = { south: 56.044, west: 12.69, north: 56.049, east: 12.7 };
const SOURCE = { title: 'Bergen kommune, "Elsparkesykler i Bergen"', url: 'https://www.bergen.kommune.no/elsparkesykler' };

function bergen(id: string, rule: RuleKind): RuleZoneShape {
  return {
    id, place: id, authority: 'Bergen kommune', rule, timeZone: 'Europe/Oslo', source: SOURCE,
    ring: [[60.395, 5.324], [60.395, 5.326], [60.396, 5.326]], polygons: [], inForce: true,
  };
}

beforeEach(() => localStorage.setItem('scooters-locale', 'en'));

/** What the legend lists, item by item, and its credit. */
function listed(container: HTMLElement) {
  return {
    items: [...container.querySelectorAll('.zone-legend-item')].map(item => item.textContent),
    credit: container.querySelector('.zone-legend-credit')?.textContent,
  };
}

it('names each of a city\'s kinds once, the strongest first, and credits the city once, linked to where it says so', () => {
  const rules = [
    bergen('parking-1', 'parking'), bergen('no-parking-1', 'noParking'), bergen('slow-1', 'slow'),
    bergen('no-parking-2', 'noParking'), bergen('no-ride-1', 'noRide'),
  ];
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
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
  const { container } = render(<I18nProvider><ZoneLegend state="shown" count={2} rules={rules} /></I18nProvider>);
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
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['No riding 12:00–23:00 (not now)'], credit: 'Seoul, lines © OpenStreetMap' });
  expect(container.querySelector('.zone-legend-rule')!.getAttribute('data-in-force')).toBe('false');
});

it('names Nagoya\'s pavements once, a line for a swatch, credited to the rules with JARTIC\'s credit', async () => {
  const nagoya = ZONE_CITIES.find(city => city.id === 'nagoya')!;
  const { default: file } = await CITY_ZONE_FILES.nagoya();
  const rules = ruleZonesInView({ bounds: SAKAE, zoom: 16 }, Date.now(), cityRuleZones(nagoya, file));
  expect(rules.length).toBeGreaterThan(10);
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
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
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
  expect(listed(container)).toEqual({ items: ['Park only in racks or marked places'], credit: 'Helsingborgs stad' });
  expect(container.querySelector('.zone-legend-item .zone-swatch')!.className).toBe('zone-swatch zone-swatch-racksOnly');
  expect(screen.getByRole('link', { name: 'Helsingborgs stad' }).getAttribute('href')).toBe(helsingborg.source.url);
});
