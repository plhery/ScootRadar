// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
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
    expect(document.documentElement.lang).toBe('en-US');
  });

  it('takes the region of the language chosen, not of the first one the browser lists', async () => {
    browserLanguages(['en-US', 'fr-CA']);
    localStorage.setItem('scooters-locale', 'fr');
    render(<I18nProvider><Probe /></I18nProvider>);
    await waitFor(() => expect(screen.getByRole('status').textContent?.replace(/\s/g, ' ')).toBe('fr CA 12 345,6'));
    expect(document.documentElement.lang).toBe('fr-CA');
  });

  it('keeps Switzerland when the browser names no region for the UI language', async () => {
    browserLanguages(['de']);
    render(<I18nProvider><Probe /></I18nProvider>);
    await waitFor(() => expect(document.documentElement.lang).toBe('de-CH'));
    expect(screen.getByRole('status')).toHaveTextContent(/^de CH 12.345\.6$/);
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
