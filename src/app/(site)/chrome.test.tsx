// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LANDING_LOCALES, landingPath, type LandingLocale } from '@/lib/landingCopy';
import { SiteBar, SiteFooter } from './chrome';

const EVERY_LANGUAGE = LANDING_LOCALES.map(locale => ({ locale, href: landingPath(locale) }));

function bar(locale: LandingLocale, languages = EVERY_LANGUAGE) {
  return render(<SiteBar locale={locale} home="#top" links={[]} languages={languages} />).container;
}

/** The seats a visitor sees: the hidden ones are those the guess did not take. */
function shownSeats(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLAnchorElement>('.seat:not([hidden]):not(button)')].map(seat => seat.lang);
}

describe('the languages in the bar of the site', () => {
  it('seat the page’s language, English for a visitor we know nothing about, and Others', () => {
    const container = bar('fr');
    expect(shownSeats(container)).toEqual(['fr', 'en']);
    expect(container.querySelector('.seat[aria-current="page"]')).toHaveAttribute('href', '/fr');
    expect(screen.getByRole('button', { name: 'Autres' })).toHaveAttribute('popovertarget', 'languages');
  });

  it('have a hidden seat for every other language, for the Worker to show the one it guesses', () => {
    const group = bar('fr').querySelector('.langs')!;
    expect(group).toHaveAttribute('data-guess-page', 'fr');
    expect(group).toHaveAttribute('data-guess-from', 'en de it nl nb pt es is');
    expect(group).toHaveAttribute('data-reason-browser', 'Votre navigateur');
    expect([...group.querySelectorAll('[data-guess-seat]')].map(seat => seat.getAttribute('data-guess-seat')))
      .toEqual(['en', 'de', 'it', 'nl', 'nb', 'pt', 'es', 'is']);
  });

  it('seat no second language on the English page until the Worker knows the visitor', () => {
    expect(shownSeats(bar('en'))).toEqual(['en']);
  });

  it('list every language behind Others by its own name, then by the page’s', () => {
    const list = bar('de').querySelector<HTMLElement>('#languages')!;
    const items = within(list).getAllByRole('link', { hidden: true });
    expect(items.map(item => item.querySelector('.langs-item-name')?.textContent))
      .toEqual(['Deutsch', 'English', 'Español', 'Français', 'Íslenska', 'Italiano', 'Nederlands', 'Norsk', 'Português']);
    expect(items[0]).toHaveAttribute('aria-current', 'page');
    expect(items[1].querySelector('.langs-item-why')).toHaveAttribute('data-reason', 'Standard');
    expect(items[3].querySelector('.langs-item-sub')).toHaveTextContent('Französisch');
    expect(items[7].querySelector('.langs-item-sub')).toHaveTextContent('Norwegisch');
    expect(list.querySelectorAll('[data-reason]')).toHaveLength(1);
  });

  it('seat each of three languages, with no list', () => {
    const container = bar('nl', [
      { locale: 'en', href: '/guides/brussels' },
      { locale: 'fr', href: '/fr/guides/bruxelles' },
      { locale: 'nl', href: '/nl/gidsen/brussel' },
    ]);
    expect(shownSeats(container)).toEqual(['nl', 'en', 'fr']);
    expect(container.querySelector('[data-guess-page]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('are not there for a page in one language', () => {
    expect(bar('it', [{ locale: 'it', href: '/it/guide/catania' }]).querySelector('.langs')).toBeNull();
  });
});

describe('the languages in the footer of the site', () => {
  it('are every language, written out, to this page where it has one and the home page where not', () => {
    render(<SiteFooter locale="en" languages={[{ locale: 'en', href: '/guides/riga' }, { locale: 'de', href: '/de/ratgeber/riga' }]} />);
    const links = within(screen.getByRole('navigation', { name: 'Language' })).getAllByRole('link');
    expect(links.map(link => link.textContent))
      .toEqual(['Deutsch', 'English', 'Español', 'Français', 'Íslenska', 'Italiano', 'Nederlands', 'Norsk', 'Português']);
    expect(links[0]).toHaveAttribute('href', '/de/ratgeber/riga');
    expect(links[1]).toHaveAttribute('href', '/guides/riga');
    expect(links[1]).toHaveAttribute('aria-current', 'page');
    expect(links[3]).toHaveAttribute('href', '/fr');
  });
});
