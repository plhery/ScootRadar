// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ControlSheet from '@/components/ControlSheet';
import { track } from '@/lib/analytics';
import { appStoreUrl } from '@/lib/appStore';
import { I18nProvider } from '@/lib/i18n';
import { PROVIDER_KEYS } from '@/lib/types';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

type Props = React.ComponentProps<typeof ControlSheet>;

function sheetProps(overrides: Partial<Props> = {}): Props {
  return {
    open: true,
    panel: 'filters',
    minBattery: 0,
    enabledProviders: new Set(PROVIDER_KEYS),
    availableProviders: ['lime', 'bird', 'dott', 'bolt'],
    providerCounts: { bolt: 4, dott: 2, lime: 1200 },
    downProviders: [],
    hasActiveFilters: false,
    showCount: 14,
    theme: 'auto',
    mapStyle: 'calm',
    zones: false,
    onClose: vi.fn(),
    onMinBatteryChange: vi.fn(),
    onProviderToggle: vi.fn(),
    onResetFilters: vi.fn(),
    onThemeChange: vi.fn(),
    onMapStyleChange: vi.fn(),
    onZonesChange: vi.fn(),
    ...overrides,
  };
}

function renderSheet(overrides: Partial<Props> = {}) {
  const props = sheetProps(overrides);
  const view = render(<I18nProvider><ControlSheet {...props} /></I18nProvider>);
  const rerender = (next: Partial<Props>) =>
    view.rerender(<I18nProvider><ControlSheet {...props} {...next} /></I18nProvider>);
  return { ...view, props, rerender };
}

const providerRows = () =>
  within(screen.getByRole('group', { name: 'Providers' })).getAllByRole('button');
// The thousands separator of Swiss numbers depends on the runtime's locale data.
const grouped = (value: number) => new Intl.NumberFormat('en-CH').format(value);

beforeEach(() => {
  localStorage.setItem('scooters-locale', 'en');
  // jsdom has neither modal dialogs nor animations.
  HTMLDialogElement.prototype.showModal = function showModal() { this.open = true; };
  HTMLDialogElement.prototype.close = function close() { this.open = false; };
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('prefers-reduced-motion') }));
});

afterEach(() => vi.unstubAllGlobals());

describe('ControlSheet filters', () => {
  it('is a dialog named Filters that opens and closes with the page', () => {
    const { rerender, container } = renderSheet({ open: false });
    const dialog = container.querySelector('dialog')!;
    expect(dialog.open).toBe(false);

    rerender({ open: true });
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBe(dialog);
    expect(dialog.open).toBe(true);

    rerender({ open: false });
    expect(dialog.open).toBe(false);
  });

  it('offers the battery minimum as one choice of four, without a slider', () => {
    const { props, rerender } = renderSheet();
    const battery = screen.getByRole('group', { name: 'Battery' });
    const presets = within(battery).getAllByRole('button');
    expect(presets.map(preset => preset.textContent)).toEqual(['Any', '30%+', '60%+', '80%+']);
    expect(presets.map(preset => preset.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'false', 'false']);
    expect(screen.queryByRole('slider')).toBeNull();
    // Nothing is hidden while any battery level will do.
    expect(screen.queryByText('Scooters without battery info are hidden while a minimum is set.')).toBeNull();

    fireEvent.click(within(battery).getByRole('button', { name: '60%+' }));
    expect(props.onMinBatteryChange).toHaveBeenCalledExactlyOnceWith(60);
    // The choice already made is not made again.
    fireEvent.click(within(battery).getByRole('button', { name: 'Any' }));
    expect(props.onMinBatteryChange).toHaveBeenCalledOnce();

    rerender({ minBattery: 60 });
    expect(within(battery).getByRole('button', { name: '60%+' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(battery).getByRole('button', { name: 'Any' })).toHaveAttribute('aria-pressed', 'false');
    expect(battery).toHaveAccessibleDescription('Scooters without battery info are hidden while a minimum is set.');
  });

  it('shows a minimum from the slider era as the preset below it', () => {
    renderSheet({ minBattery: 45 });
    expect(screen.getByRole('button', { name: '30%+' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('lists the providers of this part of the map in catalogue order with their counts', () => {
    const { props } = renderSheet({ enabledProviders: new Set(['bolt', 'bird', 'lime']) });
    const rows = providerRows();
    expect(rows.map(row => row.getAttribute('aria-label'))).toEqual([
      'Bolt, 4. Shown.',
      'Bird, 0. Shown.',
      'Dott, 2. Hidden.',
      `Lime, ${grouped(1200)}. Shown.`,
    ]);
    expect(rows.map(row => row.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false', 'true']);
    expect(rows.map(row => row.querySelector('.provider-count')?.textContent)).toEqual(['4', '0', '2', grouped(1200)]);
    // A check for a provider that is shown, an empty circle for one that is hidden.
    expect(rows.map(row => row.querySelector('.provider-check svg') !== null)).toEqual([true, true, false, true]);

    fireEvent.click(rows[2]);
    expect(props.onProviderToggle).toHaveBeenCalledExactlyOnceWith('dott');
  });

  it('says that a provider is not sharing data instead of counting it, and keeps it a choice', () => {
    const { props } = renderSheet({ downProviders: ['bird'] });
    const [bolt, bird, dott, lime] = providerRows();
    expect(bird).toHaveAccessibleName('Bird: not sharing data right now');
    expect(bird).toHaveTextContent('Not sharing data right now');
    expect(bird.querySelector('.provider-count')).toBeNull();
    // Chosen, but nothing to promise: the circle is dashed and has no check.
    expect(bird).toHaveClass('provider-down');
    expect(bird).toHaveAttribute('aria-pressed', 'true');
    expect(bird.querySelector('.provider-check svg')).toBeNull();
    // The others are counted as before.
    for (const row of [bolt, dott, lime]) expect(row).not.toHaveClass('provider-down');
    expect(lime).toHaveAccessibleName(`Lime, ${grouped(1200)}. Shown.`);

    fireEvent.click(bird);
    expect(props.onProviderToggle).toHaveBeenCalledExactlyOnceWith('bird');
  });

  it('says so where no provider operates', () => {
    renderSheet({ availableProviders: [], providerCounts: {}, showCount: 0 });
    const group = screen.getByRole('group', { name: 'Providers' });
    expect(within(group).queryAllByRole('button')).toHaveLength(0);
    expect(group).toHaveTextContent('No scooter data here yet');
  });

  it('resets only when a filter is active', () => {
    const { props, rerender } = renderSheet();
    const reset = screen.getByRole('button', { name: 'Reset' });
    expect(reset).toBeDisabled();
    fireEvent.click(reset);
    expect(props.onResetFilters).not.toHaveBeenCalled();

    rerender({ hasActiveFilters: true });
    expect(reset).toBeEnabled();
    fireEvent.click(reset);
    expect(props.onResetFilters).toHaveBeenCalledOnce();
  });

  it.each([
    ['fr', 'Afficher 0 trottinette', 'Afficher 1 trottinette', 'Afficher 2 trottinettes'],
    ['de', '0 Scooter anzeigen', '1 Scooter anzeigen', '2 Scooter anzeigen'],
    ['it', 'Mostra 0 monopattini', 'Mostra 1 monopattino', 'Mostra 2 monopattini'],
    ['en', 'Show 0 scooters', 'Show 1 scooter', 'Show 2 scooters'],
  ])('counts none, one and two scooters as %s does', async (locale, none, one, two) => {
    localStorage.setItem('scooters-locale', locale);
    const { rerender, container } = renderSheet({ showCount: 0 });
    // French takes the singular for none; the other three the plural.
    const show = container.querySelector('.sheet-primary')!;
    await vi.waitFor(() => expect(show).toHaveTextContent(none));
    rerender({ showCount: 1 });
    expect(show).toHaveTextContent(one);
    rerender({ showCount: 2 });
    expect(show).toHaveTextContent(two);
  });

  it('ends with a button that says what the map will show and closes the sheet', () => {
    const { props, rerender } = renderSheet();
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(within(dialog).queryByRole('button', { name: 'Done' })).toBeNull();
    const show = within(dialog).getByRole('button', { name: 'Show 14 scooters' });

    rerender({ showCount: 1 });
    expect(show).toHaveTextContent('Show 1 scooter');
    rerender({ showCount: 0 });
    expect(show).toHaveTextContent('Show 0 scooters');
    rerender({ showCount: 2000 });
    expect(show).toHaveTextContent(`Show ${grouped(2000)} scooters`);
    // The answer for a new minimum is on its way: there is no count to promise.
    rerender({ showCount: null });
    expect(show).toHaveTextContent('Finding scooters…');

    fireEvent.click(show);
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('closes with Escape', () => {
    const { props } = renderSheet();
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});

describe('ControlSheet settings', () => {
  const settings = (overrides: Partial<Props> = {}) => renderSheet({ panel: 'settings', ...overrides });
  const pressed = (group: HTMLElement) =>
    within(group).getAllByRole('button').map(button => `${button.textContent}:${button.getAttribute('aria-pressed')}`);

  it('is a dialog named Settings with appearance, map, language and About, in that order', () => {
    settings();
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(within(dialog).getAllByRole('heading', { level: 3 }).map(heading => heading.textContent))
      .toEqual(['Appearance', 'Map', 'Language', 'About']);
    // The sources live in the credits; nothing is left of the English-only footer.
    expect(within(dialog).queryByRole('link', { name: /MobiData BW/ })).toBeNull();
    expect(within(dialog).queryByRole('button', { name: 'Reset' })).toBeNull();
  });

  it('offers the appearance as Automatic, Light or Dark', () => {
    const { props, rerender } = settings();
    const appearance = screen.getByRole('group', { name: 'Appearance' });
    expect(pressed(appearance)).toEqual(['Automatic:true', 'Light:false', 'Dark:false']);

    fireEvent.click(within(appearance).getByRole('button', { name: 'Dark' }));
    expect(props.onThemeChange).toHaveBeenCalledExactlyOnceWith('dark');
    // The appearance already chosen is not chosen again.
    fireEvent.click(within(appearance).getByRole('button', { name: 'Automatic' }));
    expect(props.onThemeChange).toHaveBeenCalledOnce();

    rerender({ panel: 'settings', theme: 'dark' });
    expect(pressed(appearance)).toEqual(['Automatic:false', 'Light:false', 'Dark:true']);
  });

  it('offers the map as Calm or Detailed, each with a picture', () => {
    const { props, rerender } = settings();
    const map = screen.getByRole('group', { name: 'Map' });
    expect(pressed(map)).toEqual(['Calm:true', 'Detailed:false']);
    expect(map.querySelector('.map-style-calm')).not.toBeNull();
    expect(map.querySelector('.map-style-detailed')).not.toBeNull();

    fireEvent.click(within(map).getByRole('button', { name: 'Detailed' }));
    expect(props.onMapStyleChange).toHaveBeenCalledExactlyOnceWith('detailed');
    fireEvent.click(within(map).getByRole('button', { name: 'Calm' }));
    expect(props.onMapStyleChange).toHaveBeenCalledOnce();

    rerender({ panel: 'settings', mapStyle: 'detailed' });
    expect(pressed(map)).toEqual(['Calm:false', 'Detailed:true']);
  });

  it('offers the operators\' zones as a switch, off until turned on', () => {
    const { props, rerender } = settings();
    const zones = screen.getByRole('switch', { name: 'Ride and parking zones' });
    expect(zones).not.toBeChecked();
    expect(zones).toHaveAccessibleDescription(/Each operator’s app has the final word/);
    fireEvent.click(zones);
    expect(props.onZonesChange).toHaveBeenCalledExactlyOnceWith(true);
    rerender({ panel: 'settings', zones: true });
    expect(zones).toBeChecked();
  });

  const browserLanguages = (languages: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  // The row of the Language section, which leads to the list of languages, and what it says on its left and right.
  const languageRow = (heading = 'Language') =>
    within(screen.getByRole('heading', { name: heading, level: 3 }).closest('section')!).getByRole('button');
  const rowSays = (row: HTMLElement) => [...row.children].map(part => part.textContent);
  // Each choice of the list as it reads, its lines apart, then whether it is the one chosen and has the check.
  const languageChoices = () =>
    [...screen.getByRole('dialog').querySelectorAll('button[aria-pressed]')].map(choice => {
      const lines = [...choice.querySelectorAll('.language-copy > span')].map(line => line.textContent).join(' / ');
      return `${lines}:${choice.getAttribute('aria-pressed')}${choice.querySelector('svg') ? ' ✓' : ''}`;
    });
  const choice = (name: string) => screen.getByText(name, { selector: '.language-copy > span' }).closest('button')!;

  it('shows the language on screen in one row, and says Automatic while it is the browser\'s', async () => {
    settings();
    // English was chosen: nothing more to say.
    await vi.waitFor(() => expect(rowSays(languageRow())).toEqual(['English', '']));
    expect(languageRow().querySelector('[lang]')).toHaveAttribute('lang', 'en');
    cleanup();

    localStorage.removeItem('scooters-locale');
    browserLanguages(['de-CH', 'en']);
    settings();
    await vi.waitFor(() => expect(rowSays(languageRow('Sprache'))).toEqual(['Deutsch', 'Automatisch']));
    expect(languageRow('Sprache').querySelector('[lang]')).toHaveAttribute('lang', 'de');
  });

  it('lists Automatic, then every language by its own name, and leads back to the row', async () => {
    settings();
    await vi.waitFor(() => expect(rowSays(languageRow())).toEqual(['English', '']));
    fireEvent.click(languageRow());
    const languages = screen.getByRole('dialog', { name: 'Language' });
    expect(within(languages).getByRole('heading', { name: 'Language', level: 2 })).toHaveFocus();
    expect(within(languages).queryByRole('group', { name: 'Appearance' })).toBeNull();
    expect(languageChoices()).toEqual([
      'Automatic / English, the language of your browser:false',
      // In the same order in every language; the name on screen beside each, but English's own.
      'Deutsch / German:false',
      'English:true ✓',
      'Español / Spanish:false',
      'Français / French:false',
      'Íslenska / Icelandic:false',
      'Italiano / Italian:false',
      'Nederlands / Dutch:false',
      'Norsk / Norwegian:false',
      'Português / Portuguese:false',
    ]);
    expect(choice('Deutsch').querySelector('[lang]')).toHaveAttribute('lang', 'de');
    expect(choice('Íslenska').querySelector('[lang]')).toHaveAttribute('lang', 'is');
    expect(choice('Automatic')).toHaveAccessibleDescription('Follows your browser’s language, if you change it there.');

    fireEvent.click(within(languages).getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(languageRow()).toHaveFocus();
  });

  it('switches at once, stays on the list, and keeps the language chosen', async () => {
    settings();
    await vi.waitFor(() => expect(rowSays(languageRow())).toEqual(['English', '']));
    fireEvent.click(languageRow());
    fireEvent.click(choice('Deutsch'));
    expect(track).toHaveBeenCalledExactlyOnceWith('language_change', { language: 'de' });
    expect(localStorage.getItem('scooters-locale')).toBe('de');
    const sprache = screen.getByRole('dialog', { name: 'Sprache' });
    expect(languageChoices()).toEqual([
      'Automatisch / English, die Sprache deines Browsers:false',
      'Deutsch:true ✓',
      'English / Englisch:false',
      'Español / Spanisch:false',
      'Français / Französisch:false',
      'Íslenska / Isländisch:false',
      'Italiano / Italienisch:false',
      'Nederlands / Niederländisch:false',
      'Norsk / Norwegisch:false',
      'Português / Portugiesisch:false',
    ]);
    // The language already chosen is not chosen again.
    fireEvent.click(choice('Deutsch'));
    expect(track).toHaveBeenCalledOnce();

    fireEvent.click(within(sprache).getByRole('button', { name: 'Einstellungen' }));
    expect(rowSays(languageRow('Sprache'))).toEqual(['Deutsch', '']);
    expect(languageRow('Sprache')).toHaveFocus();
  });

  it('forgets the language chosen with Automatic, and follows the browser\'s', async () => {
    browserLanguages(['de-CH', 'en']);
    settings();
    await vi.waitFor(() => expect(rowSays(languageRow())).toEqual(['English', '']));
    fireEvent.click(languageRow());
    expect(languageChoices()[0]).toBe('Automatic / Deutsch, the language of your browser:false');

    fireEvent.click(choice('Automatic'));
    expect(track).toHaveBeenCalledExactlyOnceWith('language_change', { language: 'auto' });
    expect(localStorage.getItem('scooters-locale')).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Sprache' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('de-CH');
    // The check is on Automatic alone, though German is on screen.
    expect(languageChoices().filter(line => line.endsWith('✓'))).toEqual(['Automatisch / Deutsch, die Sprache deines Browsers:true ✓']);

    fireEvent.click(screen.getByRole('button', { name: 'Einstellungen' }));
    expect(rowSays(languageRow('Sprache'))).toEqual(['Deutsch', 'Automatisch']);
  });

  it('opens on the first view again when closed on the list of languages', () => {
    const { rerender } = settings();
    fireEvent.click(languageRow());
    expect(screen.getByRole('dialog', { name: 'Language' })).toBeInTheDocument();
    rerender({ panel: 'settings', open: false });
    rerender({ panel: 'settings', open: true });
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
  });

  it('leads from About to the privacy notice and to the source code', () => {
    settings();
    expect(screen.getByRole('link', { name: 'Privacy notice' })).toHaveAttribute('href', '/privacy');
    const source = screen.getByRole('link', { name: 'Source code on GitHub' });
    expect(source).toHaveAttribute('href', 'https://github.com/plhery/ScootRadar');
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAttribute('rel', 'noreferrer');
  });

  it.each([
    ['Safari', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'],
    ['Chrome', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1'],
  ])('leads first from About to the iPhone app on an iPhone, in %s', (_browser, userAgent) => {
    const agent = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    try {
      settings();
      const about = screen.getByRole('heading', { name: 'About' }).nextElementSibling!;
      const app = within(about as HTMLElement).getAllByRole('link')[0];
      expect(app.querySelector('.app-row-name')).toHaveTextContent(/^iPhone app$/);
      expect(app).toHaveAttribute('href', appStoreUrl('web-map-settings'));
      expect(app.querySelector('img')).toHaveAttribute('src', '/icon-180.png');
      expect(app.querySelector('.row-value')).toHaveTextContent('App Store');
    } finally {
      agent.mockRestore();
    }
  });

  it.each([
    ['an iPad', 'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1'],
    ['a Mac', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15'],
    ['Android', 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36'],
  ])('does not lead to the iPhone app on %s', (_device, userAgent) => {
    const agent = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
    try {
      settings();
      expect(screen.queryByRole('link', { name: /iPhone app/ })).toBeNull();
      expect(screen.getAllByRole('link').map(link => link.textContent)).toEqual(['Privacy notice', 'Source code on GitHub']);
    } finally {
      agent.mockRestore();
    }
  });

  it('opens the credits list from About, and leads back to where it was opened', () => {
    const { rerender } = settings();
    fireEvent.click(screen.getByRole('button', { name: 'Map & data credits' }));
    const credits = screen.getByRole('dialog', { name: 'Map & data credits' });
    // The view starts at its heading; the settings themselves are out of the way.
    expect(within(credits).getByRole('heading', { name: 'Map & data credits', level: 2 })).toHaveFocus();
    expect(within(credits).queryByRole('group', { name: 'Appearance' })).toBeNull();
    const links = within(credits).getAllByRole('link');
    expect(links.map(link => link.textContent)).toEqual([
      '© OpenStreetMap contributors',
      'OpenFreeMap © OpenMapTiles',
      'Walking routes · Valhalla, FOSSGIS',
      'Fix the map · OpenStreetMap',
      'Mobility data CH',
      'France: Dott, Bird, Lime, Voi, Pony, Naolib Micromob’',
      // Each country's own, from data/countries.json: the GBFS feeds credited together, then the licences.
      'DE/IT/BE/UK/PT/ES/IS/SE/LV/PL/HU/GR/CY/FI/HR/UA: Dott, Bolt, Hopp, Lime, Voi, Zeus, Yoio, Bird, Elerent, Hoppy, Ride Mobility, 3electra',
      'US/CA/CR/BQ: Bird, Bolt, Lime, Veo, Spin, Lyft, Hopp',
      'AE/SA/IL: Dott, SAHAM, Bird, Lime',
      'NZ: Flamingo, JOLT',
      'DE: MobiData BW e-scooter data',
      'DE: MobiData BW · dl-de/by-2-0, modified',
      'Voi Technology Germany GmbH via NRW.Mobidrom, CC BY-SA 4.0, modified',
      'BE: Pony · transportdata.be',
      'NO: Entur AS · NLOD',
      'NO: Kartverket boundaries · CC BY 4.0',
      'UK: Beryl · CDLA-Permissive-2.0',
      'UK: ONS boundaries · OGL v3.0',
      'PT: DGT boundaries · CC BY 4.0',
      'DE/SE: Qick map',
      'DE/AT/IT/ES/PL/HU/GR/FI: Dott map',
      'DE/AT/IT/NO/UK/DK/SE/FI: Voi map',
      'CA: MoVe rider map',
      'NZ: Flamingo · CC BY 4.0',
      'JP: LUUP map',
      'BR/CL/MX/KZ/AZ/GE: JET map',
      'BR/CL/MX/KZ/CO/BY: Whoosh map',
      'ZA: Zippy rider map',
      'DE/AT/IT/BE/UK/DK/SE/PL/HU/GR/JP/CL/MX/RO/CZ/QA/AU: Lime map',
      'AU/TR/MY/KR: Beam map',
      'US/KR: GCOO map',
      'KR: Kickgoing map',
      'KR: Alpaca map',
      'CH/FR/DE/IT/BE/PT/ES/PL/FI/UA/IL/NZ/KR: OpenStreetMap boundaries · ODbL',
      'DE/BE/PT/IS/SE/LV/PL/CY/UA/KZ/RO/EE/LT/SK/BG/MD/SI/IE: Bolt map',
      'TR/MK/BA/XK: BinBin map',
      'DE/IT/BE/UK/PT/DK/LV/PL/HU/GR/CY/UA/JP/CL/MX/RO/CZ/QA/AU/EE/LT/SK/BG/MD/SI/IE/MK/BA/XK: GeoNames · CC BY 4.0',
      'Search · Geoapify',
      'Search · Photon, komoot',
      'Parking · Métropole Européenne de Lille',
    ]);
    // Sources open beside the map instead of taking its place.
    expect(links.every(link => link.getAttribute('target') === '_blank' && link.getAttribute('rel') === 'noreferrer')).toBe(true);
    expect(within(credits).getByRole('button', { name: 'Done' })).toBeInTheDocument();

    fireEvent.click(within(credits).getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Map & data credits' })).toHaveFocus();

    // Closed on the credits, the settings open on their first view again.
    fireEvent.click(screen.getByRole('button', { name: 'Map & data credits' }));
    rerender({ panel: 'settings', open: false });
    rerender({ panel: 'settings', open: true });
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
  });

  it('closes with Done', () => {
    const { props } = settings();
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
