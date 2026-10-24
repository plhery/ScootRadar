import { Fragment, type CSSProperties } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppLink, Linked, SiteBar, SiteFooter } from '../chrome';
import { GuideIndex, GuidePage, guideIndexMetadata, guideMetadata } from '../guides';
import Icon from '@/components/Icon';
import StageDepth from '@/components/StageDepth';
import { APP_STORE_QR } from '@/generated/appStoreQr';
import { PROVIDERS } from '@/generated/providers';
import { appStoreUrl, smartAppBanner, SMART_APP_BANNER } from '@/lib/appStore';
import { COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, COVERED_PROVIDER_TOTAL } from '@/lib/coveredCities';
import { formatLocale } from '@/lib/formatLocale';
import type { TranslationKey } from '@/lib/i18n';
import { landingCountries } from '@/lib/landingCities';
import {
  LANDING_COPY,
  LANDING_LOCALES,
  SOURCE_URL,
  landingPath,
  type LandingCopy,
  type LandingLocale,
} from '@/lib/landingCopy';
import {
  LANDING_NEAREST,
  LANDING_SCOOTERS_NEARBY,
  type LandingNearest,
} from '@/lib/landingSnapshot';
import { DEFAULT_RIDE_DURATION, RIDE_DURATIONS, formatRidePrice, ridePriceQuote } from '@/lib/ridePrice';
import type { RidePricing } from '@/lib/types';
import { MAP_PATH } from '@/lib/mapAddress';
import { inkOn } from '@/lib/providerColor';
import { OPEN_GRAPH_ALTERNATE_LOCALES, OPEN_GRAPH_LOCALES, SITE_NAME, SITE_URL, shareImage } from '@/lib/site';
import { sitePageOf, sitePagePath, type SitePage } from '@/lib/sitePages';
import { formatDistance, walkingMinutes } from '@/lib/walking';

type Props = Readonly<{ params: Promise<{ path?: string[] }> }>;

// The steps of the app's battery filter; the page shows it set to the third.
const BATTERY_STEPS = [30, 60, 80] as const;
const BATTERY_STEP_SHOWN = 60;

// Bird's black would vanish on a page this dark: its marker is white on the
// app's dark map, too.
const TILE_COLORS: Record<string, string> = { bird: '#f4f5f7' };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = sitePageOf((await params).path);
  if (!page) return {};
  // Safari offers the iPhone app above every page, to open on it.
  return { ...pageMetadata(page), other: { [SMART_APP_BANNER]: smartAppBanner(new URL(sitePagePath(page), SITE_URL)) } };
}

function pageMetadata(page: SitePage): Metadata {
  switch (page.kind) {
    case 'landing':
      return landingMetadata(page.locale);
    case 'guides':
      return guideIndexMetadata(page.locale);
    case 'guide':
      return guideMetadata(page.guide);
  }
}

function landingMetadata(locale: LandingLocale): Metadata {
  const { meta } = LANDING_COPY[locale];
  const description = meta.description(COVERED_CITY_TOTAL);
  const share = { url: shareImage(locale), width: 1200, height: 630, alt: meta.share.alt };
  return {
    title: meta.title,
    description,
    alternates: {
      canonical: landingPath(locale),
      languages: {
        ...Object.fromEntries(LANDING_LOCALES.map(language => [language, landingPath(language)])),
        'x-default': '/',
      },
    },
    openGraph: {
      type: 'website',
      url: landingPath(locale),
      siteName: SITE_NAME,
      title: meta.title,
      description,
      locale: OPEN_GRAPH_LOCALES[locale],
      ...(OPEN_GRAPH_ALTERNATE_LOCALES[locale] ? { alternateLocale: [...OPEN_GRAPH_ALTERNATE_LOCALES[locale]] } : {}),
      images: [share],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description,
      images: [share],
    },
  };
}

/**
 * What the page tells a search engine in so many words: who publishes it, the
 * app it leads to, and the questions it answers.
 */
function structuredData(locale: LandingLocale, copy: LandingCopy) {
  const organization = `${SITE_URL}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organization,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon-512.png`,
        sameAs: [SOURCE_URL],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        inLanguage: [...LANDING_LOCALES],
        publisher: { '@id': organization },
      },
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}${MAP_PATH}#app`,
        name: SITE_NAME,
        url: `${SITE_URL}${MAP_PATH}`,
        description: copy.meta.description(COVERED_CITY_TOTAL),
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        inLanguage: [...LANDING_LOCALES],
        isAccessibleForFree: true,
        // Free wherever it is used: no currency, which Google asks for only above zero.
        offers: { '@type': 'Offer', price: '0' },
        screenshot: `${SITE_URL}/landing/${locale}-dark.webp`,
        image: `${SITE_URL}${shareImage(locale)}`,
        publisher: { '@id': organization },
      },
      {
        '@type': 'FAQPage',
        '@id': `${new URL(landingPath(locale), SITE_URL).href}#faq`,
        inLanguage: locale,
        mainEntity: copy.faq.items.map(({ question, answer }) => ({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };
}

/** Numbers, distances and prices as the app writes them in this language. */
function formatters(locale: LandingLocale) {
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(formatLocale(locale), options).format(value);
  // The two units of a distance, which none of the four languages spells differently.
  const t = (key: TranslationKey, values?: Record<string, string | number>) =>
    `${values?.count} ${key === 'distance.meters' ? 'm' : 'km'}`;

  return {
    distance: (meters: number) => formatDistance(meters, { t, formatNumber }),
    price: (pricing: RidePricing) =>
      formatRidePrice(ridePriceQuote(pricing, DEFAULT_RIDE_DURATION).totalMinorUnits, pricing.currency, locale),
  };
}

type Formatters = ReturnType<typeof formatters>;

/** What a card says under the name of its provider, one fact at a time. */
function cardFacts(scooter: LandingNearest, copy: LandingCopy, format: Formatters): string[] {
  return scooter.shows
    .flatMap(fact => {
      switch (fact) {
        case 'walk':
          return [copy.card.walk(walkingMinutes(scooter.distanceM))];
        case 'battery':
          return scooter.battery === null ? [] : [`${scooter.battery}%`];
        case 'range':
          return scooter.rangeM === null ? [] : [copy.card.range(format.distance(scooter.rangeM))];
        case 'price':
          return scooter.pricing ? [copy.card.price(format.price(scooter.pricing), DEFAULT_RIDE_DURATION)] : [];
        case 'bike':
          return [copy.card.bike];
      }
    });
}

function tileColor(provider: string): string {
  return TILE_COLORS[provider] ?? PROVIDERS[provider].color;
}

/** A provider's tile as the app draws it: white initials, dark only on a colour too light for white. */
function Tile({ provider }: { provider: string }) {
  const { initial } = PROVIDERS[provider];
  const color = tileColor(provider);
  return (
    <span
      className={initial.length > 1 ? 'tile tile--wide' : 'tile'}
      aria-hidden="true"
      style={{ '--c': color, '--ink': inkOn(color) } as CSSProperties}
    >
      {initial}
    </span>
  );
}

/**
 * A capture of the iPhone app in its phone. public/landing holds them, sized
 * ahead: scripts/generate-landing-images.mjs takes them.
 */
function Phone({ src, alt, className, first = false }: {
  src: string;
  alt: string;
  className?: string;
  /** The picture of the first screen is not left for later. */
  first?: boolean;
}) {
  return (
    <div className={className ? `phone ${className}` : 'phone'}>
      <div className="phone-body">
        {/* eslint-disable-next-line @next/next/no-img-element -- Sized ahead: the Worker has no image optimizer. */}
        <img
          src={src}
          alt={alt}
          width={780}
          height={1695}
          loading={first ? 'eager' : 'lazy'}
          fetchPriority={first ? 'high' : undefined}
          decoding="async"
        />
      </div>
    </div>
  );
}

/** The mark of GitHub, beside the words that lead to the code there. */
function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

/**
 * The QR code of the App Store link, beside its button where the page is read
 * on a computer: one look from an iPhone. Drawn when the site is built
 * (scripts/generate-app-store-qr.mjs), in the quiet zone of its white tile.
 */
function AppStoreQr({ copy }: { copy: LandingCopy }) {
  const quiet = 3;
  const side = APP_STORE_QR.size + 2 * quiet;
  return (
    <div className="app-qr">
      <svg viewBox={`${-quiet} ${-quiet} ${side} ${side}`} shapeRendering="crispEdges" aria-hidden="true">
        <path d={APP_STORE_QR.path} />
      </svg>
      <p>{copy.scanQr}</p>
    </div>
  );
}

/** The two ways in: the map, and the iPhone app, each link to it counted where it is. */
function Actions({ copy, campaign, qr = false }: {
  copy: LandingCopy;
  campaign: 'web-hero' | 'web-closing';
  /** With the QR code of the App Store link beside them. */
  qr?: boolean;
}) {
  return (
    <div className="cta-row">
      <AppLink className="btn btn--solid" href={MAP_PATH}>{copy.openMap}</AppLink>
      <a className="btn btn--line" href={appStoreUrl(campaign)}><Icon name="phone" size={20} />{copy.iphoneApp}</a>
      {qr && <AppStoreQr copy={copy} />}
    </div>
  );
}

export default async function SitePage({ params }: Props) {
  const page = sitePageOf((await params).path);
  if (!page) notFound();

  switch (page.kind) {
    case 'landing':
      return <LandingPage locale={page.locale} />;
    case 'guides':
      return <GuideIndex locale={page.locale} />;
    case 'guide':
      return <GuidePage guide={page.guide} />;
  }
}

function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = LANDING_COPY[locale];
  const format = formatters(locale);
  const picture = (scene: string) => `/landing/${locale}-${scene}.webp`;
  const nearby = LANDING_SCOOTERS_NEARBY;
  // The scooter the page follows from the hero down, and the runner-up it is compared with.
  const [nearest, second] = LANDING_NEAREST;
  // Not every provider publishes its rates: the ride is priced on the nearest scooter of one that does.
  const priced = LANDING_NEAREST.find(scooter => scooter.pricing);
  const glow = { '--c': tileColor(nearest.provider) } as CSSProperties;
  const languages = LANDING_LOCALES.map(language => ({ locale: language, href: landingPath(language) }));
  // The providers in the order the page names them: by name, the one with bikes last.
  const named = [...LANDING_NEAREST].sort(
    (a, b) =>
      Number(a.provider === 'publibike') - Number(b.provider === 'publibike') || a.name.localeCompare(b.name),
  );

  return (
    <>
      <script
        type="application/ld+json"
        // Nothing in it can close the tag: "<" is written as its escape.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(locale, copy)).replace(/</g, '\\u003c') }}
      />
      <SiteBar
        locale={locale}
        home="#top"
        links={[{ href: '#know', label: copy.nav.shows }, { href: '#cities', label: copy.nav.cities }]}
        languages={languages}
      />

      <main>
        <section className="hero">
          <h1 className="display">{copy.hero.title(nearby)}</h1>
          <p className="lede">{copy.hero.lede}</p>
          <Actions copy={copy} campaign="web-hero" qr />
          <p className="note">
            {copy.hero.note}{' '}
            <a href={SOURCE_URL}><GitHubMark />{copy.hero.openSource}</a>.
          </p>
        </section>

        <StageDepth className="stage" aria-label={copy.hero.stage} style={glow}>
          <div className="orb orb--near" aria-hidden="true" />
          <div className="orb orb--night" aria-hidden="true" />
          <Phone className="stage-phone" src={picture('dark')} alt={copy.hero.alt(nearby)} first />
          {/* Nearest first. The layout places seven cards: four to the left of the phone, three to its right. */}
          <ol className="near">
            {LANDING_NEAREST.map((scooter, index) => (
              <li
                className="near-card"
                key={scooter.provider}
                style={{ '--c': tileColor(scooter.provider), '--i': index } as CSSProperties}
              >
                <Tile provider={scooter.provider} />
                <span className="near-text">
                  <span className="near-head">
                    <span>{scooter.name}</span>
                    <span className="near-distance">{format.distance(scooter.distanceM)}</span>
                  </span>
                  <span className="near-facts">
                    {cardFacts(scooter, copy, format).map(fact => <span key={fact}>{fact}</span>)}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </StageDepth>

        <section className="know" id="know">
          <h2 className="title">{copy.know.title}</h2>

          <div className="bento">
            <div className="cell cell--wide">
              <div className="cell-copy">
                <h3 className="heading">{copy.know.all.title}</h3>
                <p>{copy.know.all.text}</p>
                <p className="strong">
                  {copy.know.all.close(
                    nearest.name,
                    format.distance(nearest.distanceM),
                    second.name,
                    format.distance(second.distanceM),
                  )}
                </p>
                <ul className="tiles" aria-label={copy.know.all.providers}>
                  {named.map((scooter, index) => (
                    <li key={scooter.provider} title={scooter.name} style={{ '--i': index } as CSSProperties}>
                      <Tile provider={scooter.provider} />
                      <span className="sr-only">{scooter.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="cell-shot">
                <Phone className="phone--day" src={picture('zurich-day')} alt={copy.know.all.alt} />
              </div>
            </div>

            <div className="cell" style={glow}>
              <div>
                <p className="figure figure--near">{format.distance(nearest.distanceM)}</p>
                <p className="figure-label">{copy.card.walk(walkingMinutes(nearest.distanceM))}</p>
              </div>
              <div>
                <h3>{copy.know.walk.title}</h3>
                <p>{copy.know.walk.text}</p>
              </div>
            </div>

            <div className="cell">
              <div>
                <p className="figure figure--charge">{BATTERY_STEP_SHOWN}%+</p>
                <div
                  className="segments"
                  role="img"
                  aria-label={copy.know.charge.control}
                  // How many steps from "any" the one that is on is: the page slides the control there.
                  style={{ '--on': BATTERY_STEPS.indexOf(BATTERY_STEP_SHOWN) + 1 } as CSSProperties}
                >
                  <span aria-hidden="true">{copy.know.charge.any}</span>
                  {BATTERY_STEPS.map(step => (
                    <span key={step} aria-hidden="true" className={step === BATTERY_STEP_SHOWN ? 'is-on' : undefined}>
                      {step}%+
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3>{copy.know.charge.title}</h3>
                <p>{copy.know.charge.text}</p>
              </div>
            </div>

            {priced?.pricing && (
              <div className="cell">
                <div>
                  <p className="figure figure--price">≈&nbsp;{format.price(priced.pricing)}</p>
                  <p className="figure-label">{copy.know.price.ride(priced.name)}</p>
                  <div className="chips" role="img" aria-label={copy.know.price.control}>
                    {RIDE_DURATIONS.map(minutes => (
                      <span key={minutes} aria-hidden="true" className={minutes === DEFAULT_RIDE_DURATION ? 'is-on' : undefined}>
                        {copy.know.price.duration(minutes)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3>{copy.know.price.title}</h3>
                  <p>{copy.know.price.text}</p>
                </div>
              </div>
            )}

            <div className="cell">
              <div
                className="buttons"
                role="img"
                aria-label={copy.know.unlock.control(copy.know.unlock.directions, copy.know.unlock.openIn(nearest.name))}
              >
                <span aria-hidden="true"><Icon name="directions" size={20} />{copy.know.unlock.directions}</span>
                <span aria-hidden="true" className="is-on">{copy.know.unlock.openIn(nearest.name)}</span>
              </div>
              <div>
                <h3>{copy.know.unlock.title}</h3>
                <p>{copy.know.unlock.text}</p>
              </div>
            </div>

            <div className="cell cell--wide cell--looks">
              <div className="cell-copy">
                <h3 className="heading">{copy.know.looks.title}</h3>
                <p>{copy.know.looks.text}</p>
              </div>
              <div className="cell-shot cell-shot--pair">
                <Phone className="phone--day" src={picture('pier-day')} alt={copy.know.looks.light} />
                <Phone className="phone--night" src={picture('pier-night')} alt={copy.know.looks.dark} />
              </div>
            </div>
          </div>
        </section>

        <section className="cities" id="cities">
          <div className="cities-copy">
            <h2 className="title">{copy.cities.title(COVERED_CITY_TOTAL)}</h2>
            <p className="lede">{copy.cities.lede(COVERED_PROVIDER_TOTAL, COVERED_COUNTRY_TOTAL)}</p>
            <dl className="countries">
              {landingCountries().map(({ country, total, featured, more }) => (
                <div className="country" key={country}>
                  <dt>{copy.cities.countries[country]} <span>{total}</span></dt>
                  <dd>
                    {featured.map((city, index) => (
                      <Fragment key={city.href}>
                        {index > 0 && ', '}
                        <a href={city.href}>{city.name}</a>
                      </Fragment>
                    ))}
                    {more > 0 && ` ${copy.cities.more(more)}`}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <Phone className="cities-phone" src={picture('overview')} alt={copy.cities.alt} />
        </section>

        <section className="faq" id="faq">
          <h2 className="title">{copy.faq.title}</h2>
          <dl className="questions">
            {copy.faq.items.map(({ question, answer }) => (
              <div className="question" key={question}>
                <dt>{question}</dt>
                <dd>{answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="closing" style={glow}>
          <div className="orb orb--closing" aria-hidden="true" />
          <h2 className="display">{copy.closing.title}</h2>
          <Actions copy={copy} campaign="web-closing" />
          <p className="note"><Linked sentence={copy.closing.note} links={{ source: SOURCE_URL }} /></p>
        </section>
      </main>

      <SiteFooter locale={locale} languages={languages} />
    </>
  );
}
