import type { ComponentProps } from 'react';
import Icon from '@/components/Icon';
import { GUIDE_COPY } from '@/lib/guideCopy';
import { landingGuides } from '@/lib/guides';
import {
  LANDING_COPY, LANDING_LOCALES, LANGUAGE_NAMES, SOURCE_URL, landingPath, linkedParts, makerLinks, type LandingLocale,
} from '@/lib/landingCopy';
import { guessLanguage } from '@/lib/languageGuess';
import { MAP_PATH } from '@/lib/mapAddress';
import { SITE_NAME } from '@/lib/site';

// What every page of the site has around it, the landing page and the guides:
// the bar at the top and the footer.

/**
 * A link to the app or to its privacy notice. They are under the other root
 * layout, so the browser loads them whole: an anchor, not a route change.
 */
export function AppLink(props: ComponentProps<'a'>) {
  return <a {...props} />;
}

/** A sentence of the copy with its links in it: each name it gives one has its address here. */
export function Linked({ sentence, links }: { sentence: string; links: Readonly<Record<string, string>> }) {
  return linkedParts(sentence).map(({ text, link }) => (link ? <a key={link} href={links[link]}>{text}</a> : text));
}

/** This page in a language it is written in. */
export interface PageLanguage {
  locale: LandingLocale;
  href: string;
}

/**
 * The bar at the top: the name, which leads home, the links of the page, the
 * languages the page is in, and the map.
 */
export function SiteBar({ locale, home, links, languages }: {
  locale: LandingLocale;
  home: string;
  links: readonly { href: string; label: string }[];
  /** This page in each language it is written in. With one, there is nothing to choose. */
  languages: readonly PageLanguage[];
}) {
  const copy = LANDING_COPY[locale];
  return (
    <header className="top" id="top">
      <nav className="pill" aria-label={copy.nav.main}>
        <a className="brand" href={home}>
          {/* eslint-disable-next-line @next/next/no-img-element -- The icon of the app, an SVG. */}
          <img src="/icon.svg" alt="" width={30} height={30} />
          {SITE_NAME}
        </a>
        {links.map(link => <a key={link.href} className="pill-link" href={link.href}>{link.label}</a>)}
        {languages.length > 1 && <LanguageSeats locale={locale} languages={languages} />}
        <AppLink className="pill-cta" href={MAP_PATH}>{copy.openMap}</AppLink>
      </nav>
    </header>
  );
}

/** The bar has three seats for the languages, however many the page is in. */
const SEATS = 3;

/**
 * The languages of the page in the bar. Up to three, each has a seat. With
 * more, three seats: the page's language, the one we guess the visitor reads,
 * and Others, which opens the list of all of them.
 *
 * The guess is made twice. Here, for a visitor we know nothing about, so the
 * page as built has one; then by the Worker, worker.ts, for each visitor, from
 * their browser and where they are. Every language the guess can be has its
 * seat here, hidden but for one, and the Worker only changes which: it touches
 * attributes, never text, so the page the browser hydrates is still the page
 * React rendered. The list is a popover of plain links, so it opens without
 * script, closes with Escape, and a search engine follows every language.
 */
function LanguageSeats({ locale, languages }: { locale: LandingLocale; languages: readonly PageLanguage[] }) {
  const copy = LANDING_COPY[locale];
  const current = languages.find(language => language.locale === locale);
  const others = languages.filter(language => language.locale !== locale);
  if (!current) return null;

  if (languages.length <= SEATS) {
    return (
      <div className="langs" role="group" aria-label={copy.nav.languages}>
        {[current, ...others].map(language => (
          <Seat key={language.locale} language={language} current={language === current} />
        ))}
      </div>
    );
  }

  const guess = guessLanguage({ page: locale, available: languages.map(language => language.locale) });
  return (
    <div
      className="langs"
      role="group"
      aria-label={copy.nav.languages}
      data-guess-page={locale}
      data-guess-from={others.map(language => language.locale).join(' ')}
    >
      <Seat language={current} current />
      {others.map(language => (
        <Seat key={language.locale} language={language} guessed hidden={language.locale !== guess} />
      ))}
      <button type="button" className="seat seat-more" popoverTarget={LANGUAGE_LIST}>
        <Icon name="globe" size={16} strokeWidth={2} />
        {copy.nav.others}
      </button>
      <div id={LANGUAGE_LIST} className="langs-menu" popover="auto">
        <p className="langs-menu-title">{copy.nav.languages}</p>
        <ul>
          {[...languages].sort(byName(locale)).map(language => {
            const isCurrent = language === current;
            return (
              <li key={language.locale}>
                <a
                  href={language.href}
                  hrefLang={language.locale}
                  lang={language.locale}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  <span className="langs-item-name">{LANGUAGE_NAMES[language.locale]}</span>
                  {isCurrent
                    ? <Icon name="check" size={18} strokeWidth={2.4} />
                    : <span className="langs-item-sub" lang={locale}>{languageNameIn(locale, language.locale)}</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const LANGUAGE_LIST = 'languages';

/** A language in the bar: its code from a tablet up, its name on a phone, where the seats have a row of their own. */
function Seat({ language, current = false, guessed = false, hidden = false }: {
  language: PageLanguage;
  current?: boolean;
  /** A seat the guess can take: the Worker shows the one it guesses. */
  guessed?: boolean;
  hidden?: boolean;
}) {
  const name = LANGUAGE_NAMES[language.locale];
  return (
    <a
      className="seat"
      href={language.href}
      hrefLang={language.locale}
      lang={language.locale}
      title={name}
      aria-current={current ? 'page' : undefined}
      data-guess-seat={guessed ? language.locale : undefined}
      hidden={hidden}
    >
      <span className="seat-code" aria-hidden="true">{language.locale.toUpperCase()}</span>
      <span className="seat-name">{name}</span>
    </a>
  );
}

/** Languages in the order of their own names, as the page's language sorts them. */
function byName(locale: LandingLocale) {
  return (a: PageLanguage, b: PageLanguage) => LANGUAGE_NAMES[a.locale].localeCompare(LANGUAGE_NAMES[b.locale], locale);
}

/** A language as the page's language names it: "German" on the English page. Norwegian is named without its written form. */
function languageNameIn(locale: LandingLocale, language: LandingLocale): string {
  const name = new Intl.DisplayNames([locale], { type: 'language' }).of(language === 'nb' ? 'no' : language) ?? LANGUAGE_NAMES[language];
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/**
 * The foot of every page: its guides, every language of the site written out,
 * where someone looks when the bar is not in theirs, and what the site is. A
 * language the page is not written in leads to the home page in it.
 */
export function SiteFooter({ locale, languages }: { locale: LandingLocale; languages: readonly PageLanguage[] }) {
  const copy = LANDING_COPY[locale];
  const guides = landingGuides(locale, GUIDE_COPY[locale].all);
  const everyLanguage = LANDING_LOCALES
    .map(language => languages.find(page => page.locale === language) ?? { locale: language, href: landingPath(language) })
    .sort(byName(locale));
  return (
    <footer className="footer">
      {guides.length > 0 && (
        <nav className="guides" aria-labelledby="guides">
          <h2 id="guides">{copy.footer.guides}</h2>
          <ul>
            {guides.map(guide => (
              <li key={guide.href}><a href={guide.href}>{guide.title}</a></li>
            ))}
          </ul>
        </nav>
      )}
      <nav className="footer-langs" aria-labelledby="footer-langs">
        <h2 id="footer-langs">
          <Icon name="globe" size={17} strokeWidth={2} />
          {copy.nav.languages}
        </h2>
        <ul>
          {everyLanguage.map(language => (
            <li key={language.locale}>
              <a
                href={language.href}
                hrefLang={language.locale}
                lang={language.locale}
                aria-current={language.locale === locale ? 'page' : undefined}
              >
                {LANGUAGE_NAMES[language.locale]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="footer-about">
        <p>{copy.footer.text}</p>
        <nav aria-label={copy.footer.links}>
          <AppLink href="/privacy" hrefLang="en">{copy.footer.privacy}</AppLink>
          <a href={SOURCE_URL}>{copy.footer.source}</a>
        </nav>
      </div>
      <p className="maker"><Linked sentence={copy.footer.maker} links={makerLinks(locale)} /></p>
    </footer>
  );
}
