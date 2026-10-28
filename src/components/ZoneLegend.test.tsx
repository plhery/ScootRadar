// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import ZoneLegend from '@/components/ZoneLegend';
import { I18nProvider } from '@/lib/i18n';
import { ruleZonesInView, type RuleKind, type RuleZoneShape } from '@/lib/ruleZones';

const SEOUL_NOON = Date.parse('2026-10-26T03:00:00Z');
const HONGDAE = { south: 37.55, west: 126.918, north: 37.558, east: 126.93 };
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
