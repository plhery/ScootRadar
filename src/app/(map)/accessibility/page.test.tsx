// @vitest-environment jsdom
import { act } from 'react';
import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import AccessibilityPage, { metadata } from './page';

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('lang');
});

it('is shared as the accessibility page, not as the map', () => {
  expect(metadata.openGraph?.url).toBe('/accessibility');
  expect(metadata.openGraph?.title).toBe(metadata.title);
  expect(metadata.openGraph?.description).toBe(metadata.description);
  expect(metadata.twitter?.title).toBe(metadata.title);
  expect(metadata.twitter?.description).toBe(metadata.description);
});

it('says in its description that it lists the known gaps, in the 160 characters a search engine shows', () => {
  expect(String(metadata.description)).toContain('known gaps');
  expect(String(metadata.description).length).toBeLessThanOrEqual(160);
});

it('is read as English, the language it is written in, whatever language the map is shown in', async () => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-CH', 'de']);
  const view = render(<I18nProvider><AccessibilityPage /></I18nProvider>);
  // The map's language is the browser's, set on the whole document once the page is open.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(document.documentElement.lang).toBe('de-CH');
  expect(view.getByRole('heading', { level: 1, name: 'Accessibility' }).closest('[lang]')).toHaveAttribute('lang', 'en');
});
