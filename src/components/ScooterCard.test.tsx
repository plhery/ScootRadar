// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScooterCard, { type SelectedVehicle } from '@/components/ScooterCard';
import type { CardWalk } from '@/components/WalkAction';
import { I18nProvider } from '@/lib/i18n';
import type { Vehicle } from '@/lib/types';
import { formatClockTime } from '@/lib/uiText';
import type { WalkView } from '@/lib/walkState';

const lime: Vehicle = {
  provider: 'lime', lat: 47.37, lng: 8.54, battery: 82, range_m: 24_000,
  vehicle_id: 'lime-1', deep_link: null, distance_m: null,
  rental_uris: { ios: 'https://li.me/ride', android: 'https://li.me/ride', web: 'https://li.me/ride' },
  pricing: { currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 35 },
};

function renderCard(
  selection: Partial<SelectedVehicle> = {},
  vehicle: Partial<Vehicle> = {},
  locating = false,
  walk: Partial<CardWalk> = {}
) {
  const props = {
    selection: { vehicle: { ...lime, ...vehicle }, walk: { distanceM: 126, place: null }, ...selection },
    onClose: vi.fn(),
    onLocate: vi.fn(),
    walk: { view: null, tooFar: false, onStart: vi.fn(), onHide: vi.fn(), ...walk },
  };
  const card = (isLocating: boolean, cardWalk = props.walk) => (
    <I18nProvider><ScooterCard {...props} locating={isLocating} walk={cardWalk} /></I18nProvider>
  );
  const view = render(card(locating));
  return {
    ...props,
    setLocating: (isLocating: boolean) => view.rerender(card(isLocating)),
    setWalk: (next: Partial<CardWalk>) => view.rerender(card(locating, { ...props.walk, ...next })),
    unmount: view.unmount,
  };
}

/** The walk as the card is given it, in one phase. */
const walkView = (phase: WalkView['phase'], extra: Partial<WalkView> = {}): WalkView => ({
  phase, failure: null, line: [], routeId: null, remainingM: null, ...extra,
});

const plain = (text: string | null | undefined) => text?.replace(/\s+/g, ' ') ?? null;
/** The figures of the card: the number with its unit, what it measures, and what a screen reader hears instead. */
const figures = () => [...document.querySelectorAll('.card-figure')].map(figure => ({
  value: plain(figure.querySelector('strong')?.textContent),
  label: plain(figure.querySelector('.card-figure-label')?.textContent),
  spoken: plain(figure.querySelector('.sr-only')?.textContent),
}));
const facts = () => document.querySelector('.card-title p');

beforeEach(() => {
  localStorage.clear();
});

describe('ScooterCard', () => {
  it('names the provider and says how long the walk is', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Lime' })).toBeVisible();
    expect(screen.getByText('≈2 min walk · 126 m')).toBeVisible();
  });

  it('says where the walk starts when the origin is a searched place', () => {
    renderCard({ walk: { distanceM: 320, place: 'Zürich HB' } });

    expect(screen.getByText('≈4 min walk from Zürich HB · 320 m')).toBeVisible();
  });

  it('offers to locate instead of inventing a walking time without an origin', () => {
    const props = renderCard({ walk: null });

    expect(screen.queryByText(/min walk/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on location to see walking time' }));
    expect(props.onLocate).toHaveBeenCalledOnce();
  });

  it('says that the location is on its way instead of offering to locate a second time', () => {
    const props = renderCard({ walk: null });
    fireEvent.click(screen.getByRole('button', { name: 'Turn on location to see walking time' }));
    expect(props.onLocate).toHaveBeenCalledOnce();

    // Up to ten seconds for a fix: the link is gone, so a second request cannot be started.
    props.setLocating(true);
    expect(screen.queryByRole('button', { name: 'Turn on location to see walking time' })).not.toBeInTheDocument();
    const line = screen.getByText('Finding your location…');
    expect(line).toBeVisible();
    expect(line.querySelector('.mini-spinner')).toBeInTheDocument();
    expect(props.onLocate).toHaveBeenCalledOnce();

    // No fix after all: the offer is back.
    props.setLocating(false);
    expect(screen.getByRole('button', { name: 'Turn on location to see walking time' })).toBeVisible();
  });

  it('shows the walking time of a known origin also while another fix is on its way', () => {
    renderCard({}, {}, true);

    expect(screen.getByText('≈2 min walk · 126 m')).toBeVisible();
    expect(screen.queryByText('Finding your location…')).not.toBeInTheDocument();
  });

  it('sets the walk, the distance and the price as three figures, and the rest in a line under the name', () => {
    renderCard();

    expect(figures()).toEqual([
      { value: '2min', label: 'on foot', spoken: '≈2 min walk · 126 m' },
      { value: '126m', label: 'away', spoken: null },
      { value: '4.50', label: 'CHF, 10 min', spoken: '≈ CHF 4.50 for 10 min' },
    ]);
    expect(facts()).toHaveTextContent(/^82% battery, 24 km range$/);
    expect(screen.getByText('CHF 1.00 to unlock, then CHF 0.35 a minute')).toHaveClass('card-note');
  });

  it('says a figure to a screen reader in one sentence instead of its parts', () => {
    renderCard();

    const [walk, distance, price] = document.querySelectorAll('.card-figure');
    for (const figure of [walk, price]) {
      expect(figure).not.toHaveAttribute('aria-hidden');
      expect(figure.querySelector('strong')).toHaveAttribute('aria-hidden', 'true');
      expect(figure.querySelector('.card-figure-label')).toHaveAttribute('aria-hidden', 'true');
    }
    // The distance is said with the walk.
    expect(distance).toHaveAttribute('aria-hidden', 'true');
  });

  it('says where the walk starts under its figure', () => {
    renderCard({ walk: { distanceM: 1_420, place: 'Zürich HB' } });

    expect(figures().slice(0, 2)).toEqual([
      { value: '18min', label: 'from Zürich HB', spoken: '≈18 min walk from Zürich HB · 1.4 km' },
      { value: '1.4km', label: 'away', spoken: null },
    ]);
  });

  it('wears the colour and the initial of the provider', () => {
    renderCard();

    const symbol = document.querySelector('.card-symbol')!;
    expect(symbol).toHaveTextContent(/^L$/);
    expect(symbol).toHaveAttribute('aria-hidden', 'true');
    const card = document.querySelector<HTMLElement>('.scooter-card')!;
    expect(card.style.getPropertyValue('--provider-color')).toContain('--provider-lime');
    expect(card.style.getPropertyValue('--provider-ink')).toContain('--provider-lime-ink');
  });

  it('puts the battery among the figures when there is no price to show', () => {
    renderCard({}, { pricing: undefined });

    // Read as "Battery 82%": the number alone would follow the distance unexplained.
    expect(figures()[2]).toEqual({ value: '82%', label: 'battery', spoken: 'Battery 82%' });
    expect(facts()).toHaveTextContent(/^24 km range$/);
    expect(screen.getByText('Price shown in the Lime app')).toHaveClass('card-note');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('says under the price that the city bans renting at night, and from when it can be rented', () => {
    const until = Date.parse('2026-10-13T03:00:00Z');
    renderCard({ curfew: { city: 'Oslo', until, timeZone: 'Europe/Oslo' } });

    // By Oslo's clock, named where the device's reads otherwise.
    const line = screen.getByText(`Night ban in Oslo: you can rent it from ${formatClockTime(until, 'en', undefined, 'Europe/Oslo')}`).closest('p');
    expect(line).toHaveClass('card-note', 'card-curfew');
    expect(line?.previousElementSibling).toHaveTextContent('CHF 1.00 to unlock, then CHF 0.35 a minute');
  });

  it('puts the range there when the battery is not known either', () => {
    renderCard({}, { pricing: undefined, battery: null });

    expect(figures()[2]).toEqual({ value: '24km', label: 'range', spoken: 'Range 24 km' });
    expect(facts()).toBeNull();
  });

  it('shows what is known of the scooter itself without a place to walk from', () => {
    renderCard({ walk: null });

    expect(figures()).toEqual([
      { value: '82%', label: 'battery', spoken: 'Battery 82%' },
      { value: '24km', label: 'range', spoken: 'Range 24 km' },
      { value: '4.50', label: 'CHF, 10 min', spoken: '≈ CHF 4.50 for 10 min' },
    ]);
  });

  it.each([
    ['de', ['Akku', 'Reichweite', 'CHF, 10 Min.'], ['Akku 82%', 'Reichweite 24 km']],
    ['fr', ['de batterie', 'd’autonomie', 'CHF, 10 min'], ['Batterie 82%', 'Autonomie 24 km']],
    ['it', ['di batteria', 'di autonomia', 'CHF, 10 min'], ['Batteria 82%', 'Autonomia 24 km']],
  ])('names them in %s', async (locale, labels, spoken) => {
    localStorage.setItem('scooters-locale', locale);
    renderCard({ walk: null });

    await screen.findByText(labels[0]);
    expect(figures().map(figure => figure.label)).toEqual(labels);
    expect(figures().slice(0, 2).map(figure => figure.spoken)).toEqual(spoken);
  });

  it.each([
    ['de', '2Min.', 'zu Fuss', 'entfernt', '82% Akku, 24 km Reichweite', 'CHF 1.00 zum Entsperren, dann CHF 0.35 pro Minute'],
    ['fr', '2min', 'à pied', 'de distance', '82 % de batterie, 24 km d’autonomie', '1.00 CHF pour déverrouiller, puis 0.35 CHF par minute'],
    ['it', '2min', 'a piedi', 'di distanza', '82% di batteria, 24 km di autonomia', 'CHF 1.00 per sbloccare, poi CHF 0.35 al minuto'],
  ])('writes the walk, the line under the name and the tariff in %s', async (locale, walk, onFoot, away, line, tariff) => {
    localStorage.setItem('scooters-locale', locale);
    renderCard();

    await screen.findByText(onFoot);
    expect(figures().slice(0, 2).map(({ value, label }) => [value, label])).toEqual([[walk, onFoot], ['126m', away]]);
    expect(plain(facts()?.textContent)).toBe(line);
    expect(plain(document.querySelector('.card-note')?.textContent)).toBe(tariff);
  });

  it.each([
    [82, null],
    [50, null],
    [49, 'low'],
    [20, 'low'],
    [19, 'critical'],
    [0, 'critical'],
  ])('says a battery of %i%% in its colour (%s), among the figures and under the name', (battery, level) => {
    const among = renderCard({}, { battery, pricing: undefined });
    expect(document.querySelectorAll('.card-figure')[2].className)
      .toBe(level ? `card-figure card-figure-${level}` : 'card-figure');
    among.unmount();

    renderCard({}, { battery });
    expect(facts()).toHaveTextContent(`${battery}% battery, 24 km range`);
    expect(facts()?.className ?? '').toBe(level ? `card-facts-${level}` : '');
  });

  it('leaves out what the provider does not say', () => {
    renderCard({}, { battery: null, range_m: null });

    expect(facts()).toBeNull();
    expect(screen.queryByText(/%$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/km$/)).not.toBeInTheDocument();
    expect(figures().map(figure => figure.label)).toEqual(['on foot', 'away', 'CHF, 10 min']);
  });

  it('has no figures at all when nothing is known and there is no place to walk from', () => {
    renderCard({ walk: null }, { battery: null, range_m: null, pricing: undefined });

    expect(document.querySelector('.card-figures')).toBeNull();
    expect(screen.getByText('Price shown in the Lime app')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Directions' })).toBeVisible();
  });

  it('shows a price in forints or krónur without decimals', () => {
    // Hopp in Pécs: HUF 272 to start and HUF 76 a minute.
    renderCard({}, { provider: 'hopp', pricing: { currency: 'HUF', unlock_fee_minor_units: 27_200, minute_fee_minor_units: 7_600 } });

    expect(figures()[2]).toEqual({ value: "1'032", label: 'HUF, 10 min', spoken: "≈ HUF 1'032 for 10 min" });
    expect(screen.getByText('HUF 272 to unlock, then HUF 76 a minute')).toHaveClass('card-note');
  });

  it('says + tax after the prices of a tariff tax is added to', () => {
    // Veo in New York: USD 1 to unlock and USD 0.42 a minute, before sales tax.
    renderCard({}, { pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 42, plus_tax: true } });

    expect(figures()[2]).toEqual({ value: '5.20', label: 'USD, 10 min', spoken: '≈ US$ 5.20 + tax for 10 min' });
    expect(screen.getByText('US$ 1.00 to unlock, then US$ 0.42 a minute + tax')).toHaveClass('card-note');
  });

  it("says a price copied from the operator's price list is one, and when it was checked", () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
    try {
      // Lime in Chicago publishes no price in its feed: USD 1 to unlock and USD 0.39 a minute on its site.
      renderCard({}, { provider: 'lime', pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 39, plus_tax: true, listed_on: '2026-10-18' } });

      expect(figures()[2]).toEqual({ value: '4.90', label: 'USD, 10 min', spoken: '≈ US$ 4.90 + tax for 10 min' });
      expect(screen.getByText('US$ 1.00 to unlock, then US$ 0.39 a minute + tax · published price, checked 18 Oct')).toHaveClass('card-note');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a price in hryvnias with its kopiyky', () => {
    // 3electra in Kyiv: UAH 12 to start and UAH 5.60 a minute.
    renderCard({}, { provider: 'zelectra', pricing: { currency: 'UAH', unlock_fee_minor_units: 1_200, minute_fee_minor_units: 560 } });

    expect(figures()[2]).toEqual({ value: '68.00', label: 'UAH, 10 min', spoken: '≈ UAH 68.00 for 10 min' });
    expect(screen.getByText('UAH 12.00 to unlock, then UAH 5.60 a minute')).toHaveClass('card-note');
  });

  it('says so when unlocking costs nothing', () => {
    renderCard({}, { pricing: { currency: 'CHF', unlock_fee_minor_units: 0, minute_fee_minor_units: 45 } });

    expect(screen.getByText('No unlock fee, CHF 0.45 a minute')).toHaveClass('card-note');
    expect(figures()[2].value).toBe('4.50');
  });

  it('opens the provider app with the app’s blue button, next to directions', () => {
    renderCard();

    expect(screen.getByRole('button', { name: 'Directions' })).not.toHaveClass('card-action-primary');
    const open = screen.getByRole('link', { name: 'Open in Lime' });
    expect(open).toHaveAttribute('href', 'https://li.me/ride');
    expect(open).toHaveClass('card-action-primary');
    // The card ends with its buttons: no line under them.
    expect(document.querySelector('.card-footnote')).toBeNull();
  });

  it('opens Lime’s app on a phone when the feed links no scooter', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)');
    renderCard({}, { rental_uris: undefined });

    const open = screen.getByRole('link', { name: 'Open in Lime' });
    expect(open).toHaveAttribute('href', 'https://lime.bike/');
    expect(open).toHaveClass('card-action-primary');
  });

  it('leaves directions alone when there is no way to open the provider app', () => {
    renderCard({}, { rental_uris: undefined });

    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Directions' })).toBeVisible();
    expect(document.querySelector('.card-footnote')).toBeNull();
  });

  it('draws the way on the map from Directions, and takes it away again', () => {
    const props = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Directions' }));
    expect(props.walk.onStart).toHaveBeenCalledOnce();

    props.setWalk({ view: walkView('finding') });
    const busy = screen.getByRole('button', { name: 'Directions' });
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Finding the way…');
    // Pressed again while the way is found: it is on its way already.
    fireEvent.click(busy);
    expect(props.walk.onStart).toHaveBeenCalledOnce();

    props.setWalk({ view: walkView('shown', { line: [[47.371, 8.541], [47.37, 8.54]], routeId: 1, remainingM: 410 }) });
    expect(screen.getByRole('status')).toHaveTextContent('Route shown: ≈6 min walk · 410 m');
    fireEvent.click(screen.getByRole('button', { name: 'Hide route' }));
    expect(props.walk.onHide).toHaveBeenCalledOnce();
  });

  it('announces a way once, not again with every step taken along it', () => {
    const props = renderCard();
    const shown = (remainingM: number, routeId = 1) =>
      props.setWalk({ view: walkView('shown', { line: [[47.371, 8.541], [47.37, 8.54]], routeId, remainingM }) });

    shown(410);
    shown(330);
    expect(screen.getByRole('status')).toHaveTextContent('≈6 min walk · 410 m');
    // A way from another start is a new one.
    shown(900, 2);
    expect(screen.getByRole('status')).toHaveTextContent('≈12 min walk · 900 m');
  });

  it('opens Google Maps where no way was found on foot', () => {
    renderCard({}, {}, false, { view: walkView('failed', { failure: 'route' }) });

    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=47.37%2C8.54&travelmode=walking'
    );
    expect(screen.getByRole('status')).toHaveTextContent('Couldn’t find a walking route.');
  });

  it('does not blame the streets when the routes cannot be had for now', () => {
    renderCard({}, {}, false, { view: walkView('failed', { failure: 'unavailable' }) });

    expect(screen.getByRole('status')).toHaveTextContent('Walking routes can’t be loaded right now.');
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toBeVisible();
  });

  it('says when your location could not be had for the way', () => {
    renderCard({ walk: null }, {}, false, { view: walkView('failed', { failure: 'location' }) });

    expect(screen.getByRole('status')).toHaveTextContent('Couldn’t find your location.');
  });

  it('leaves a walk too long for the map to Google Maps', () => {
    renderCard({ walk: { distanceM: 25_000, place: null } }, {}, false, { tooFar: true });

    expect(screen.queryByRole('button', { name: 'Directions' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Directions' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=47.37%2C8.54&travelmode=walking'
    );
  });

  it('says when you are there', () => {
    renderCard({}, {}, false, { view: walkView('arrived') });

    expect(screen.getByRole('status')).toHaveTextContent('You’re there.');
    expect(screen.getByRole('link', { name: 'Open in Lime' })).toBeVisible();
  });

  it('has nothing left to offer for a scooter taken while you walked to it', () => {
    renderCard({}, {}, false, { view: walkView('gone') });

    expect(screen.getByRole('status')).toHaveTextContent('No longer on the map. Someone may have taken it.');
    expect(screen.queryByRole('link', { name: 'Open in Lime' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Directions' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Close scooter details' })).toBeVisible();
  });

  it('closes from its own button', () => {
    const props = renderCard();

    fireEvent.click(screen.getByRole('button', { name: 'Close scooter details' }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it('estimates the ride for the chosen duration and remembers the choice on this device', () => {
    renderCard();

    // One franc to unlock and 35 centimes a minute.
    expect(screen.getByText(/for 10 min/)).toHaveTextContent('≈ CHF 4.50 for 10 min');
    const picker = screen.getByRole('combobox', { name: 'Ride estimate, 10 minutes. Change duration.' });
    expect(within(picker).getAllByRole('option').map(option => option.textContent))
      .toEqual(['5 min', '10 min', '15 min', '20 min', '30 min']);

    try {
      fireEvent.change(picker, { target: { value: '20' } });
      expect(screen.getByText(/for 20 min/)).toHaveTextContent('≈ CHF 8.00 for 20 min');
      expect(figures()[2]).toMatchObject({ value: '8.00', label: 'CHF, 20 min' });
      expect(screen.getByRole('combobox', { name: 'Ride estimate, 20 minutes. Change duration.' })).toHaveValue('20');
      expect(localStorage.getItem('scooters-ride-minutes')).toBe('20');
    } finally {
      // The choice is shared by every card on the page; put it back for the other tests.
      fireEvent.change(picker, { target: { value: '10' } });
    }
  });
});
