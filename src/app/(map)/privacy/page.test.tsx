// @vitest-environment jsdom
import { act } from 'react';
import { render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/lib/i18n';
import PrivacyPage from './page';

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
