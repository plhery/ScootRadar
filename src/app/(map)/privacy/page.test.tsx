// @vitest-environment jsdom
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import { MAP_PASS_RETRY_MS } from '@/lib/mapPassClient';
import PrivacyPage, { metadata } from './page';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('lang');
});

it('is read as English, the language it is written in, whatever language the map is shown in', async () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'fr']);
  const view = render(<I18nProvider><PrivacyPage /></I18nProvider>);
  // The map's language is the browser's, set on the whole document once the page is open.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(document.documentElement.lang).toMatch(/^fr\b/);
  expect(view.getByRole('heading', { level: 1, name: 'Privacy' }).closest('[lang]')).toHaveAttribute('lang', 'en');
});

/** The page's text, without its markup. */
const text = () => renderToStaticMarkup(<PrivacyPage />).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

it('lists the units among the settings stored on the device, as PRIVACY.md does', () => {
  expect(text().match(/Local storage and service worker (.*?) are stored locally/)?.[1]).toMatch(/\bunits\b/);
});

it('lists the zones shown or not among the settings stored on the device, as PRIVACY.md does', () => {
  expect(text().match(/Local storage and service worker (.*?) are stored locally/)?.[1])
    .toMatch(/whether the map shows ride and parking zones/);
});

it('is shared as the privacy notice, not as the map', () => {
  expect(metadata.openGraph?.url).toBe('/privacy');
  expect(metadata.openGraph?.title).toBe(metadata.title);
  expect(metadata.openGraph?.description).toBe(metadata.description);
  expect(metadata.twitter?.title).toBe(metadata.title);
  expect(metadata.twitter?.description).toBe(metadata.description);
});

it('says, where it says address searches are not kept, that the last place chosen in the search is, on the device', () => {
  const overview = text().match(/ Overview (.*?) Location and map requests /)?.[1];
  expect(overview).toMatch(/address searches/);
  expect(overview).toMatch(/last place you chose in the search.* on your device/);
});

it('lists what the Android app keeps of a refused location, and the site of its invitation to test that app', () => {
  const stored = text().match(/ Local storage and service worker (.*?) Infrastructure logs /)?.[1];
  // android-location-refused (AndroidLocationManager.kt) and scooters-android-test (playTest.ts).
  expect(stored).toMatch(/in the Android app, the fact that you refused it your location/);
  expect(stored).toMatch(/invitation to test the Android app/);
});

it('says what the website\'s error reports hold and lose, and that they go to Umami only while analytics is on', () => {
  const reports = text().match(/.* Error reports (.*?) Your choices /)?.[1];
  expect(reports).toMatch(/while usage analytics is on, the website sends Umami a report of the error/);
  expect(reports).toMatch(/lose their query and fragment/);
  expect(reports).toMatch(/number with three decimals or more \(as a coordinate\), quoted text with a space in it/);
  expect(reports).toMatch(/At most five reports/);
  // src/lib/errorReportsConfig.ts names no Sentry project for the website yet.
  expect(reports).not.toMatch(/to Sentry too|Do Not Track/);
});

it('says, once the website has a Sentry project, that its reports go there whatever the visitor\'s analytics settings', async () => {
  vi.resetModules();
  vi.doMock('@/lib/errorReportsConfig', async importOriginal => ({
    ...await importOriginal<typeof import('@/lib/errorReportsConfig')>(),
    SENTRY_BROWSER_DSN: 'https://0123456789abcdef@o1.ingest.sentry.io/2',
  }));
  try {
    const { default: Page } = await import('./page');
    const reports = renderToStaticMarkup(<Page />).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').match(/.* Error reports (.*?) Your choices /)?.[1];
    expect(reports).toMatch(/The website sends these reports to Sentry too/);
    expect(reports).toMatch(/whether usage analytics is on or off and whatever your Do Not Track and Global Privacy Control settings/);
    expect(reports).toMatch(/is told not to store it/);
  } finally {
    vi.doUnmock('@/lib/errorReportsConfig');
  }
});

it('names the invisible Turnstile check, its privacy addendum and the pass cookie it leads to, as PRIVACY.md does', () => {
  const section = text().match(/ Protection against scraping (.*?) Error reports /)?.[1];
  expect(section).toMatch(/Cloudflare Turnstile checks in the background/);
  // Not once a day: whenever the map holds no pass, and again after MAP_PASS_RETRY_MS while it has none.
  expect(section).not.toMatch(/once a day/);
  expect(section).toContain(`Turnstile checks again at most every ${MAP_PASS_RETRY_MS / 60_000} minutes`);
  expect(renderToStaticMarkup(<PrivacyPage />)).toContain('href="https://www.cloudflare.com/turnstile-privacy-policy/"');
  // MAP_PASS_COOKIE and MAP_PASS_SECONDS (src/lib/mapPass.ts).
  expect(section).toMatch(/cookie for 24 hours, __Host-scootradar-pass , which holds when it expires/);
  expect(section).toMatch(/no IP address is stored/);
  // The apps' passes (src/lib/appPass.ts).
  expect(section).toMatch(/The iOS app uses Apple&#x27;s App Attest/);
  expect(section).toMatch(/Google&#x27;s Play Integrity API/);
  expect(section).toMatch(/which the server neither stores nor logs/);
  expect(section).toMatch(/The Android app built for F-Droid does not use Play Integrity/);
});

it('says an address found scraping can be refused the API for a while, and is kept only until then, as PRIVACY.md does', () => {
  const section = text().match(/ Protection against scraping (.*?) Error reports /)?.[1];
  expect(section).toMatch(/can be refused the website&#x27;s API for a set time, usually 30 days/);
  expect(section).toMatch(/only until then\./);
});
