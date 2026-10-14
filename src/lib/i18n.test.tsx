// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, useI18n } from '@/lib/i18n';

function Probe() {
  const { locale, region, formatNumber } = useI18n();
  return <output>{`${locale} ${region} ${formatNumber(12345.6)}`}</output>;
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
