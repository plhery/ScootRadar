// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ControlSheet from '@/components/ControlSheet';
import PlayTestChip from '@/components/PlayTestChip';
import { track } from '@/lib/analytics';
import { I18nProvider } from '@/lib/i18n';
import { PLAY_TEST_SNOOZE_MS, PLAY_TEST_STORAGE_KEY, playStoreUrl } from '@/lib/playTest';
import { resetPlayTestViews } from '@/lib/usePlayTest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
// The invitation as it is when switched on, whatever the switch says.
vi.mock('@/lib/playTest', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/playTest')>()), PLAY_TEST_ON: true }));

const ANDROID = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const remembered = () => JSON.parse(localStorage.getItem(PLAY_TEST_STORAGE_KEY) ?? '{}');

function browser(userAgent: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('scooters-locale', 'en');
  resetPlayTestViews();
  // jsdom has neither modal dialogs (Settings' sheet) nor animations.
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderChip() {
  const view = render(<I18nProvider><PlayTestChip /></I18nProvider>);
  // The browser is asked whether it is invited.
  await act(async () => {});
  return view;
}
const touch = () => act(() => { fireEvent.pointerDown(document.body); });
const chip = () => screen.queryByRole('link', { name: /Get our Android app/ });

describe('the map’s chip', () => {
  it('waits for the first touch of the page, then invites an Android visitor, counted once', async () => {
    browser(ANDROID);
    await renderChip();
    expect(chip()).toBeNull();
    await touch();
    expect(chip()).toHaveTextContent(/^Get our Android app$/);
    await touch();
    expect(vi.mocked(track).mock.calls).toEqual([['invite_view', { place: 'map' }]]);
  });

  it('keeps dismissal in this page when a storage write fails', async () => {
    browser(ANDROID);
    await renderChip();
    await touch();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(chip()).toBeNull();
  });

  it('invites no one on an iPhone', async () => {
    browser(IPHONE);
    await renderChip();
    await touch();
    expect(chip()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('leads to the app on Google Play, and is not offered again once followed', async () => {
    browser(ANDROID);
    const first = await renderChip();
    await touch();
    expect(chip()).toHaveAttribute('href', playStoreUrl('web-map'));
    expect(chip()).not.toHaveAttribute('target');
    fireEvent.click(chip()!);
    expect(remembered().followed).toBe(true);
    expect(track).toHaveBeenLastCalledWith('invite_install', { place: 'map' });
    expect(chip()).toBeNull();
    first.unmount();
    await renderChip();
    await touch();
    expect(chip()).toBeNull();
  });

  it('is hidden for a week by ×, which then offers “Never show”', async () => {
    browser(ANDROID);
    await renderChip();
    await touch();
    const before = Date.now();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(chip()).toBeNull();
    expect(remembered().until).toBeGreaterThanOrEqual(before + PLAY_TEST_SNOOZE_MS);
    expect(track).toHaveBeenLastCalledWith('invite_dismiss', { place: 'map' });
    expect(screen.getByRole('status')).toHaveTextContent('Hidden for a weekNever show');
    fireEvent.click(screen.getByRole('button', { name: 'Never show' }));
    expect(remembered().never).toBe(true);
    expect(track).toHaveBeenLastCalledWith('invite_never', { place: 'map' });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('says nothing for the week after ×, nor ever after “Never show”', async () => {
    browser(ANDROID);
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ until: Date.now() + 60_000 }));
    const first = await renderChip();
    await touch();
    expect(chip()).toBeNull();
    first.unmount();
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ until: Date.now() - 60_000 }));
    const second = await renderChip();
    await touch();
    expect(chip()).not.toBeNull();
    second.unmount();
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ never: true }));
    await renderChip();
    await touch();
    expect(chip()).toBeNull();
  });
});

describe('Settings › About', () => {
  async function renderSettings() {
    render(
      <I18nProvider>
        <ControlSheet
          open
          panel="settings"
          minRange={0}
          batteryRanges={{}}
          enabledProviders={new Set()}
          availableProviders={[]}
          providerCounts={{}}
          downProviders={[]}
          hasActiveFilters={false}
          showCount={0}
          theme="auto"
          mapStyle="calm"
          zones={false}
          onClose={vi.fn()}
          onMinRangeChange={vi.fn()}
          onProviderToggle={vi.fn()}
          onResetFilters={vi.fn()}
          onThemeChange={vi.fn()}
          onMapStyleChange={vi.fn()}
          onZonesChange={vi.fn()}
        />
      </I18nProvider>
    );
    await act(async () => {});
    return screen.getByRole('heading', { name: 'About' }).nextElementSibling as HTMLElement;
  }

  it('leads first to the Android app on Google Play on Android, even after “Never show”', async () => {
    browser(ANDROID);
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ never: true }));
    const about = await renderSettings();
    const row = within(about).getAllByRole('link')[0];
    expect(row).toHaveTextContent(/^Android appGoogle Play$/);
    expect(row).toHaveAttribute('href', playStoreUrl('web-map-settings'));
    fireEvent.click(row);
    expect(track).toHaveBeenLastCalledWith('invite_install', { place: 'settings' });
    expect(remembered().followed).toBe(true);
  });

  it('has no Android row elsewhere', async () => {
    browser(IPHONE);
    const about = await renderSettings();
    expect(within(about).queryByText('Android app')).toBeNull();
  });
});
