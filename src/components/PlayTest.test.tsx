// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ControlSheet from '@/components/ControlSheet';
import PlayTestChip from '@/components/PlayTestChip';
import PlayTestSheet from '@/components/PlayTestSheet';
import { track } from '@/lib/analytics';
import { I18nProvider } from '@/lib/i18n';
import { PLAY_TEST_LINKS, PLAY_TEST_SNOOZE_MS, PLAY_TEST_STORAGE_KEY } from '@/lib/playTest';
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
  // jsdom has neither modal dialogs nor animations.
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderChip(onOpen = vi.fn()) {
  const view = render(<I18nProvider><PlayTestChip onOpen={onOpen} /></I18nProvider>);
  // The browser is asked whether it is invited.
  await act(async () => {});
  return { ...view, onOpen };
}
const touch = () => act(() => { fireEvent.pointerDown(document.body); });
const chip = () => screen.queryByRole('button', { name: /Try our Android app/ });

describe('the map’s chip', () => {
  it('waits for the first touch of the page, then invites an Android visitor, counted once', async () => {
    browser(ANDROID);
    await renderChip();
    expect(chip()).toBeNull();
    await touch();
    expect(chip()).toHaveTextContent('Try our Android appEarly');
    await touch();
    expect(vi.mocked(track).mock.calls).toEqual([['invite_view', { place: 'map' }]]);
  });

  it('invites no one on an iPhone', async () => {
    browser(IPHONE);
    await renderChip();
    await touch();
    expect(chip()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('opens the steps', async () => {
    browser(ANDROID);
    const { onOpen } = await renderChip();
    await touch();
    fireEvent.click(chip()!);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenLastCalledWith('invite_open', { place: 'map' });
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

  it('thanks a tester back after the last step, once', async () => {
    browser(ANDROID);
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ step: 3 }));
    const first = await renderChip();
    await touch();
    expect(chip()).toBeNull();
    expect(screen.getByText('Thanks for testing')).toBeInTheDocument();
    expect(remembered().thanked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Thanks for testing')).toBeNull();
    first.unmount();
    await renderChip();
    await touch();
    expect(screen.queryByText('Thanks for testing')).toBeNull();
    expect(chip()).toBeNull();
  });
});

describe('the steps, over the map', () => {
  function renderSheet(onClose = vi.fn()) {
    render(<I18nProvider><PlayTestSheet open onClose={onClose} /></I18nProvider>);
    return { onClose, dialog: screen.getByRole('dialog', { name: 'Try our Android app' }) };
  }
  const steps = (dialog: HTMLElement) => within(dialog).getAllByRole('listitem');

  it('leads to the group, the opt-in and the app, each in a tab of its own, the next one in colour', () => {
    const { dialog } = renderSheet();
    const links = within(dialog).getAllByRole('link');
    expect(links.map(link => [link.textContent, link.getAttribute('href'), link.getAttribute('target')])).toEqual([
      ['Join', PLAY_TEST_LINKS.group, '_blank'],
      ['Open', PLAY_TEST_LINKS.optIn, '_blank'],
      ['Install', PLAY_TEST_LINKS.install, '_blank'],
    ]);
    expect(links[0]).toHaveAccessibleDescription('Join the testers’ group');
    expect(steps(dialog).map(step => step.dataset.state)).toEqual(['next', 'later', 'later']);
    expect(dialog).toHaveTextContent('Needs Android 12 or later.');
  });

  it('remembers each step taken, counts it, and offers the next', () => {
    const { dialog } = renderSheet();
    fireEvent.click(within(dialog).getByRole('link', { name: 'Join' }));
    expect(remembered().step).toBe(1);
    expect(track).toHaveBeenLastCalledWith('invite_group', { place: 'map' });
    expect(steps(dialog).map(step => step.dataset.state)).toEqual(['done', 'next', 'later']);
    expect(within(dialog).getByText(/^Join the testers’ group/)).toHaveTextContent('Join the testers’ group, done');
    fireEvent.click(within(dialog).getByRole('link', { name: 'Install' }));
    expect(track).toHaveBeenLastCalledWith('invite_install', { place: 'map' });
    // Back to an earlier step, the furthest one stays.
    fireEvent.click(within(dialog).getByRole('link', { name: 'Open' }));
    expect(track).toHaveBeenLastCalledWith('invite_optin', { place: 'map' });
    expect(remembered().step).toBe(3);
    expect(steps(dialog).map(step => step.dataset.state)).toEqual(['done', 'done', 'done']);
  });

  it('closes with “Not now”, for a week, or “Don’t ask again”, for good', () => {
    const { onClose } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(remembered().until).toBeGreaterThan(Date.now());
    expect(track).toHaveBeenLastCalledWith('invite_dismiss', { place: 'map' });
    fireEvent.click(screen.getByRole('button', { name: 'Don’t ask again' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(remembered().never).toBe(true);
    expect(track).toHaveBeenLastCalledWith('invite_never', { place: 'map' });
  });
});

describe('Settings › About', () => {
  async function renderSettings() {
    render(
      <I18nProvider>
        <ControlSheet
          open
          panel="settings"
          minBattery={0}
          enabledProviders={new Set()}
          availableProviders={[]}
          providerCounts={{}}
          fullRanges={{}}
          downProviders={[]}
          hasActiveFilters={false}
          showCount={0}
          theme="auto"
          mapStyle="calm"
          zones={false}
          onClose={vi.fn()}
          onMinBatteryChange={vi.fn()}
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

  it('leads first to the Android app on Android, even after “Never show”, and back', async () => {
    browser(ANDROID);
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ never: true }));
    const about = await renderSettings();
    const row = within(about).getAllByRole('button')[0];
    expect(row).toHaveTextContent(/^Android appGoogle Play$/);
    fireEvent.click(row);
    expect(track).toHaveBeenLastCalledWith('invite_open', { place: 'settings' });
    expect(screen.getByRole('heading', { level: 2, name: 'Android app' })).toHaveFocus();
    fireEvent.click(screen.getByRole('link', { name: 'Join' }));
    expect(track).toHaveBeenLastCalledWith('invite_group', { place: 'settings' });
    // The sheet's own ways out are enough here: nothing to dismiss.
    expect(screen.queryByRole('button', { name: 'Don’t ask again' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Android app/ })).toHaveFocus());
  });

  it('has no Android row elsewhere', async () => {
    browser(IPHONE);
    const about = await renderSettings();
    expect(within(about).queryByText('Android app')).toBeNull();
  });
});
