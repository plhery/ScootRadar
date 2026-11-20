// @vitest-environment jsdom

import { render, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import MapComponent from '@/components/MapComponent';
import { I18nProvider } from '@/lib/i18n';
import type { LastSeenStatus } from '@/lib/scooterDataState';
import type { Vehicle } from '@/lib/types';

// The ground's tiles are never asked for: the map stays the plain colour of the land.
vi.mock('@/lib/quietGround', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/quietGround')>(),
  groundTileUrl: () => new Promise<string>(() => {}),
}));

beforeEach(() => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});

// A Lime scooter last seen in Zürich, standing faded while Lime's positions are collected again.
const faded: Vehicle = { provider: 'lime', vehicle_id: 'lime-1', lat: 47.3775, lng: 8.5427, battery: 80, range_m: null,
  distance_m: null, deep_link: null };

function map(status: LastSeenStatus) {
  return (
    <I18nProvider>
      <MapComponent vehicles={[]} clusters={[]} clustered={false} lastSeenVehicles={[faded]} lastSeenProviders={{ lime: status }}
        origin={[47.3769, 8.5417]} initialZoom={16} distanceOrigin={null} userLocation={null} headingEnabled={false}
        focusLocation={null} focusZoom={null} focusVersion={0} destination={null} onViewportChange={() => {}}
        selectedVehicleKey={null} onVehicleSelect={() => {}} selectedParkingId={null} onParkingSelect={() => {}} />
    </I18nProvider>
  );
}

it('keeps the keyboard on a faded scooter whose app starts or stops collecting, or was seen at another time', async () => {
  const seenAt = Date.now() - 40 * 60_000;
  const view = render(map({ seenAt, updating: true }));
  const light = await waitFor(() => {
    const found = document.querySelector<HTMLButtonElement>('button.last-seen-light');
    expect(found).not.toBeNull();
    return found!;
  });
  expect(light).toHaveClass('last-seen-updating');
  light.focus();
  expect(document.activeElement).toBe(light);
  // Nothing is collecting its app's positions any more: it stops breathing, and keeps the focus.
  view.rerender(map({ seenAt, updating: false }));
  expect(document.activeElement).toBe(light);
  expect(document.querySelector('button.last-seen-light')).toBe(light);
  expect(light).not.toHaveClass('last-seen-updating');
  // Its app's positions are collected again, and it was seen later: it breathes, under its new name.
  const label = light.getAttribute('aria-label');
  view.rerender(map({ seenAt: seenAt + 5 * 60_000, updating: true }));
  expect(document.activeElement).toBe(light);
  expect(document.querySelector('button.last-seen-light')).toBe(light);
  expect(light).toHaveClass('last-seen-updating');
  expect(light.getAttribute('aria-label')).not.toBe(label);
});
