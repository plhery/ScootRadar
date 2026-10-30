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

it('gives a city\'s zones a line for each rule, the strongest first, each linked to where the city says so', () => {
  const rules = [
    bergen('parking-1', 'parking'), bergen('no-parking-1', 'noParking'), bergen('slow-1', 'slow'),
    bergen('no-parking-2', 'noParking'), bergen('no-ride-1', 'noRide'),
  ];
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
  const lines = [...container.querySelectorAll('.zone-legend-rule')];
  expect(lines.map(line => line.textContent)).toEqual([
    'No riding · Bergen kommune', 'No parking · Bergen kommune', 'Slow · Bergen kommune', 'Parking · Bergen kommune',
  ]);
  expect(lines.map(line => line.querySelector('.zone-swatch')!.className))
    .toEqual(['noRide', 'noParking', 'slow', 'parking'].map(kind => `zone-swatch zone-swatch-${kind}`));
  expect(screen.getAllByRole('link', { name: 'Bergen kommune' }).map(link => link.getAttribute('href')))
    .toEqual(Array(4).fill(SOURCE.url));
});

it('keeps a street\'s line with its hours, and the operators\' kinds before the cities\' lines', () => {
  const rules = [bergen('parking-1', 'parking'), ...ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, SEOUL_NOON)];
  const { container } = render(<I18nProvider><ZoneLegend state="shown" count={2} rules={rules} /></I18nProvider>);
  expect([...container.querySelectorAll('.zone-legend-item')].map(item => item.textContent)).toEqual([
    'No riding', 'No parking', 'Slow', 'No riding 12:00–23:00 · Seoul', 'Parking · Bergen kommune',
  ]);
});

it('gives Nagoya\'s pavements one line, a line for a swatch, linked to the rules with JARTIC\'s credit', async () => {
  const nagoya = ZONE_CITIES.find(city => city.id === 'nagoya')!;
  const { default: file } = await CITY_ZONE_FILES.nagoya();
  const rules = ruleZonesInView({ bounds: SAKAE, zoom: 16 }, Date.now(), cityRuleZones(nagoya, file));
  expect(rules.length).toBeGreaterThan(10);
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
  const lines = [...container.querySelectorAll('.zone-legend-rule')];
  expect(lines.map(line => line.textContent)).toEqual(['Pavement riding at 6 km/h · Aichi police, data JARTIC']);
  expect(lines[0].querySelector('.zone-swatch')!.className).toBe('zone-swatch zone-swatch-pavement');
  const link = screen.getByRole('link', { name: 'Aichi police, data JARTIC' });
  expect(link.getAttribute('href')).toBe('https://www.npa.go.jp/bureau/traffic/anzen/tokuteikogata.html');
  expect(link.getAttribute('title')).toMatch(/6 km\/h.*出典：「交通規制情報」（https:\/\/www\.jartic\.or\.jp\/service\/opendata\/）（公益財団法人日本道路交通情報センター）を加工して作成$/);
});

it('names central Helsingborg\'s rule, racks or marked places only, linked to the rule in Transportstyrelsen\'s register', async () => {
  const helsingborg = ZONE_CITIES.find(city => city.id === 'helsingborg')!;
  const { default: file } = await CITY_ZONE_FILES.helsingborg();
  const rules = ruleZonesInView({ bounds: STORTORGET, zoom: 16 }, Date.now(), cityRuleZones(helsingborg, file));
  const { container } = render(<I18nProvider><ZoneLegend state="off" count={0} rules={rules} /></I18nProvider>);
  const lines = [...container.querySelectorAll('.zone-legend-rule')];
  expect(lines.map(line => line.textContent)).toEqual(['Park only in racks or marked places · Helsingborgs stad']);
  expect(lines[0].querySelector('.zone-swatch')!.className).toBe('zone-swatch zone-swatch-racksOnly');
  expect(screen.getByRole('link', { name: 'Helsingborgs stad' }).getAttribute('href')).toBe(helsingborg.source.url);
});
