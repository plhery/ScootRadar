// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@/lib/analytics';
import { PLAY_TEST_ATTRIBUTE, PLAY_TEST_STORAGE_KEY } from '@/lib/playTest';
import { PLAY_TEST_COPY } from '@/lib/playTestCopy';
import { resetPlayTestViews } from '@/lib/usePlayTest';
import { PlayTestButton, PlayTestCard, PlayTestSite } from './playTest';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));
// The invitation as it is when switched on, whatever the switch says.
vi.mock('@/lib/playTest', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/playTest')>()), PLAY_TEST_ON: true }));

const ANDROID = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const de = PLAY_TEST_COPY.de;
const shown = () => document.documentElement.getAttribute(PLAY_TEST_ATTRIBUTE);
const remembered = () => JSON.parse(localStorage.getItem(PLAY_TEST_STORAGE_KEY) ?? '{}');
// jsdom names no closed dialog: the sheet is found by its heading, open or not.
const card = () => screen.getByRole('complementary', { name: de.title });
const sheet = (name = de.title) => screen.getAllByRole('heading', { name, hidden: true }).map(heading => heading.closest('dialog')).find(Boolean)!;

beforeEach(() => {
  localStorage.clear();
  resetPlayTestViews();
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
});
afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute(PLAY_TEST_ATTRIBUTE);
});

async function renderGuide(userAgent = ANDROID) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  render(<main><PlayTestCard copy={de} /><PlayTestSite copy={de} place="guide" /></main>);
  await act(async () => {});
}

describe('a guide’s card', () => {
  it('is shown to an Android visitor, as the head’s script guessed, and counted', async () => {
    await renderGuide();
    expect(shown()).toBe('offer');
    expect(card()).toHaveTextContent('Vor allen anderen.');
    expect(track).toHaveBeenCalledWith('invite_view', { place: 'guide' });
  });

  it('is taken back from a visitor the browser says is not invited', async () => {
    document.documentElement.setAttribute(PLAY_TEST_ATTRIBUTE, 'offer');
    await renderGuide(DESKTOP);
    expect(shown()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });

  it('opens the steps, in a sheet that closes with “Nicht jetzt” for a week', async () => {
    await renderGuide();
    expect(sheet()).toHaveProperty('open', false);
    fireEvent.click(within(card()).getByRole('button', { name: 'Vorab testen' }));
    expect(track).toHaveBeenLastCalledWith('invite_open', { place: 'guide' });
    expect(sheet()).toHaveProperty('open', true);
    fireEvent.click(within(sheet()).getByRole('link', { name: 'Beitreten' }));
    expect(track).toHaveBeenLastCalledWith('invite_group', { place: 'guide' });
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Nicht jetzt' }));
    expect(sheet()).toHaveProperty('open', false);
    expect(remembered()).toMatchObject({ step: 1, until: expect.any(Number) });
    expect(shown()).toBe('quiet');
  });

  it('is hidden for a week by ×, which leaves “Nie mehr zeigen” in its place', async () => {
    await renderGuide();
    fireEvent.click(within(card()).getByRole('button', { name: 'Nicht jetzt' }));
    expect(shown()).toBe('quiet');
    expect(track).toHaveBeenLastCalledWith('invite_dismiss', { place: 'guide' });
    expect(screen.getByRole('status')).toHaveTextContent('Eine Woche ausgeblendetNie mehr zeigen');
    fireEvent.click(screen.getByRole('button', { name: 'Nie mehr zeigen' }));
    expect(remembered().never).toBe(true);
    expect(track).toHaveBeenLastCalledWith('invite_never', { place: 'guide' });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('stays hidden after the last step, without thanks: those are the map’s', async () => {
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ step: 3 }));
    await renderGuide();
    expect(shown()).toBe('quiet');
    expect(track).not.toHaveBeenCalled();
  });
});

describe('the landing page’s Android button', () => {
  async function renderLanding(userAgent: string) {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    render(<main><PlayTestButton copy={PLAY_TEST_COPY.en} /><PlayTestSite copy={PLAY_TEST_COPY.en} place="landing" /></main>);
    await act(async () => {});
  }

  it('stays for an Android visitor who asked for no more invitations, and opens the steps', async () => {
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ never: true }));
    await renderLanding(ANDROID);
    expect(shown()).toBe('quiet');
    expect(track).toHaveBeenCalledWith('invite_view', { place: 'landing' });
    const button = screen.getByRole('button', { name: /^Android app\s*Early$/ });
    expect(button.parentElement).toHaveTextContent('Before anyone else, on Google Play');
    fireEvent.click(button);
    expect(track).toHaveBeenLastCalledWith('invite_open', { place: 'landing' });
    expect(sheet(PLAY_TEST_COPY.en.title)).toHaveProperty('open', true);
  });

  it('is beside the iPhone app’s on a computer, counted there, and opens the same steps', async () => {
    await renderLanding(DESKTOP);
    expect(shown()).toBeNull();
    expect(track).toHaveBeenCalledWith('invite_view', { place: 'landing' });
    fireEvent.click(screen.getByRole('button', { name: /^Android app/ }));
    expect(track).toHaveBeenLastCalledWith('invite_open', { place: 'landing' });
    expect(sheet(PLAY_TEST_COPY.en.title)).toHaveProperty('open', true);
    fireEvent.click(within(sheet(PLAY_TEST_COPY.en.title)).getByRole('link', { name: 'Open' }));
    expect(track).toHaveBeenLastCalledWith('invite_optin', { place: 'landing' });
  });

  it('is not counted on an iPhone, where it gives way to the iPhone app’s', async () => {
    await renderLanding(IPHONE);
    expect(shown()).toBeNull();
    expect(track).not.toHaveBeenCalled();
  });
});
