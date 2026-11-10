// @vitest-environment jsdom
import { act } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
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
