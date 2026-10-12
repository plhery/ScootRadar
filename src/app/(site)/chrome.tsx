import type { ComponentProps } from 'react';
import Link from 'next/link';
import { GUIDE_COPY } from '@/lib/guideCopy';
import { landingGuides } from '@/lib/guides';
import { LANDING_COPY, LANGUAGE_NAMES, SOURCE_URL, linkedParts, makerLinks, type LandingLocale } from '@/lib/landingCopy';
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

/**
 * The bar at the top: the name, which leads home, the links of the page, the
 * languages the page is in, and the map.
 */
export function SiteBar({ locale, home, links, languages }: {
  locale: LandingLocale;
  home: string;
  links: readonly { href: string; label: string }[];
  /** This page in each language it is written in. With one, there is nothing to choose. */
  languages: readonly { locale: LandingLocale; href: string }[];
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
        {languages.length > 1 && (
          <span className="langs" role="group" aria-label={copy.nav.languages}>
            {languages.map(language => (
              <Link
                key={language.locale}
                href={language.href}
                hrefLang={language.locale}
                lang={language.locale}
                prefetch={false}
                title={LANGUAGE_NAMES[language.locale]}
                aria-current={language.locale === locale ? 'page' : undefined}
              >
                {language.locale.toUpperCase()}
              </Link>
            ))}
          </span>
        )}
        <AppLink className="pill-cta" href={MAP_PATH}>{copy.openMap}</AppLink>
      </nav>
    </header>
  );
}

export function SiteFooter({ locale }: { locale: LandingLocale }) {
  const copy = LANDING_COPY[locale];
  const guides = landingGuides(locale, GUIDE_COPY[locale].all);
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
