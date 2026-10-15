// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, SUPPORTED_LOCALES, saysScooter, translate, useI18n } from '@/lib/i18n';

function Probe() {
  const { locale, region, formatNumber } = useI18n();
  return <output>{`${locale} ${region} ${formatNumber(12345.6)}`}</output>;
}

function Marker() {
  const { t } = useI18n();
  return <p>{t('marker.scooter', { name: 'Lime' })}</p>;
}

function Choice() {
  const { locale, localeChoice, browserLocale, setLocale } = useI18n();
  return (
    <>
      <output>{`${locale} ${localeChoice} ${browserLocale}`}</output>
      <button type="button" onClick={() => setLocale('fr')}>Français</button>
      <button type="button" onClick={() => setLocale('auto')}>Automatic</button>
    </>
  );
}

function browserLanguages(languages: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.documentElement.lang = '';
});

describe('I18nProvider', () => {
  it('formats for the browser region of the UI language once mounted', async () => {
    browserLanguages(['en-US', 'fr-CA']);
    render(<I18nProvider><Probe /></I18nProvider>);
    // The first render matches the server's, which knows no region.
    expect(screen.getByRole('status')).toHaveTextContent(/^en CH 12.345\.6$/);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('en US 12,345.6'));
    await waitFor(() => expect(document.documentElement.lang).toBe('en-US'));
  });

  it('takes the region of the language chosen, not of the first one the browser lists', async () => {
    browserLanguages(['en-US', 'fr-CA']);
    localStorage.setItem('scooters-locale', 'fr');
    render(<I18nProvider><Probe /></I18nProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent?.replace(/\s/g, ' ')).toBe('fr CA 12 345,6'));
    await waitFor(() => expect(document.documentElement.lang).toBe('fr-CA'));
  });

  it('keeps Switzerland when the browser names no region for the UI language', async () => {
    browserLanguages(['de']);
    render(<I18nProvider><Probe /></I18nProvider>);
    await waitFor(() => expect(document.documentElement.lang).toBe('de-CH'));
    expect(screen.getByRole('status')).toHaveTextContent(/^de CH 12.345\.6$/);
  });
});

describe('the language chosen', () => {
  const shows = (text: string) => waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(text));

  it('is the browser\'s until one is chosen, and again once Automatic is, which keeps nothing', async () => {
    browserLanguages(['de-CH', 'en']);
    render(<I18nProvider><Choice /></I18nProvider>);
    // The first render matches the server's, which knows no browser.
    expect(screen.getByRole('status')).toHaveTextContent('en auto en');
    await shows('de auto de');

    fireEvent.click(screen.getByRole('button', { name: 'Français' }));
    expect(screen.getByRole('status')).toHaveTextContent('fr fr de');
    expect(localStorage.getItem('scooters-locale')).toBe('fr');
    await waitFor(() => expect(document.documentElement.lang).toBe('fr-CH'));

    fireEvent.click(screen.getByRole('button', { name: 'Automatic' }));
    expect(screen.getByRole('status')).toHaveTextContent('de auto de');
    expect(localStorage.getItem('scooters-locale')).toBeNull();
    await waitFor(() => expect(document.documentElement.lang).toBe('de-CH'));
  });

  it('comes back with the page, and a language the app is not in is none', async () => {
    browserLanguages(['it-IT']);
    localStorage.setItem('scooters-locale', 'nb');
    const { unmount } = render(<I18nProvider><Choice /></I18nProvider>);
    await shows('nb nb it');
    unmount();

    localStorage.setItem('scooters-locale', 'pl');
    render(<I18nProvider><Choice /></I18nProvider>);
    await shows('it auto it');
  });

  it('follows the browser when its languages change while the page is open, unless one was chosen', async () => {
    browserLanguages(['en-US']);
    render(<I18nProvider><Choice /></I18nProvider>);
    await shows('en auto en');

    browserLanguages(['nl-NL', 'en']);
    fireEvent(window, new Event('languagechange'));
    await shows('nl auto nl');

    fireEvent.click(screen.getByRole('button', { name: 'Français' }));
    browserLanguages(['es-ES']);
    fireEvent(window, new Event('languagechange'));
    await shows('fr fr es');
  });
});

describe('Spanish in Latin America and the US', () => {
  const marker = (region?: string) => translate('es', 'marker.scooter', { name: 'Lime' }, region);

  it('says scooter where Spain says patinete, for the regions of Latin America and the US', () => {
    expect(marker('ES')).toBe('Patinete de Lime');
    expect(marker()).toBe('Patinete de Lime');
    for (const region of ['MX', 'US', '419', 'AR', 'CO', 'PR']) expect(marker(region)).toBe('Scooter de Lime');
    expect(translate('es', 'dock.nearby.other', {}, 'MX')).toBe('scooters cerca');
    expect(translate('es', 'filter.show.one', { count: 1 }, 'US')).toBe('Mostrar 1 scooter');
    expect(translate('es', 'dock.lead.label', {}, 'MX')).toBe('hasta el scooter más cercano');
  });

  it('leaves no patinete in the copy, changes nothing else and touches no other language', () => {
    const all = (locale: (typeof SUPPORTED_LOCALES)[number], region?: string) =>
      (['marker.scooter', 'dock.finding', 'hidden.title.other', 'common.done'] as const).map(key => translate(locale, key, { count: 2, name: 'Lime' }, region));
    expect(all('es', 'MX').join(' ')).not.toMatch(/patinete/i);
    expect(all('es', 'MX').map(sentence => sentence.replace(/[Ss]cooter/g, 'patinete').toLowerCase()))
      .toEqual(all('es', 'ES').map(sentence => sentence.toLowerCase()));
    for (const locale of SUPPORTED_LOCALES.filter(locale => locale !== 'es')) {
      expect(saysScooter(locale, 'MX')).toBe(false);
      expect(all(locale, 'US')).toEqual(all(locale));
    }
  });

  it('follows the region of the browser', async () => {
    browserLanguages(['es-MX']);
    localStorage.setItem('scooters-locale', 'es');
    render(<I18nProvider><Marker /></I18nProvider>);
    await waitFor(() => expect(screen.getByText('Scooter de Lime')).toBeInTheDocument());
  });
});

describe('names written right to left', () => {
  it('are set apart from the sentence they are put in, which keeps its order', () => {
    expect(translate('en', 'dock.lead.detailFrom', { name: 'Dott', minutes: 4, place: 'נחלת בנימין 105' }))
      .toBe('Dott, 4 min from ⁨נחלת בנימין 105⁩');
    expect(translate('en', 'parking.label', { name: 'Dott', place: 'شارع الملك فهد' })).toBe('Dott parking: ⁨شارع الملك فهد⁩');
    expect(translate('en', 'bar.aria.place', { name: 'Rothschild 22, תל אביב' }))
      .toBe('Showing scooters near ⁨Rothschild 22, תל אביב⁩. Search another place.');
  });

  it('leave the names written left to right, and the numbers, as they are', () => {
    expect(translate('en', 'dock.lead.detailFrom', { name: 'Dott', minutes: 4, place: 'Langstrasse 120' })).toBe('Dott, 4 min from Langstrasse 120');
    expect(translate('en', 'parking.label', { name: 'Lime', place: 'Θεσσαλονίκη' })).toBe('Lime parking: Θεσσαλονίκη');
  });
});

describe('a Norwegian browser', () => {
  it.each([['no-NO'], ['nn']])('asking for %s is shown the app in Norwegian', async (language) => {
    browserLanguages([language, 'en']);
    render(<I18nProvider><Choice /></I18nProvider>);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('nb auto nb'));
  });
});
