import { Fragment } from 'react';
import type { Metadata } from 'next';
import { GUIDE_COPY } from '@/lib/guideCopy';
import {
  guideCity,
  guideParts,
  guidePath,
  guidesIn,
  guidesPath,
  plainText,
  readingMinutes,
  sectionId,
  translationsOf,
  type Guide,
  type GuideBlock,
  type GuideText,
} from '@/lib/guides';
import { DEFAULT_LANDING_LOCALE, LANDING_COPY, LANDING_LOCALES, SOURCE_URL, landingPath, type LandingLocale } from '@/lib/landingCopy';
import { MAP_PATH, mapAt } from '@/lib/mapAddress';
import { OPEN_GRAPH_LOCALES, SITE_NAME, SITE_URL, shareImage } from '@/lib/site';
import { AppLink, SiteBar, SiteFooter } from './chrome';

// The guides, src/lib/guides.ts: one page each, and the list of a language's
// guides. They are read at length, in one column, on the night of the landing page.

/** The languages that have guides, each with its list. */
function indexLanguages() {
  return LANDING_LOCALES.filter(locale => guidesIn(locale).length > 0);
}

function share(locale: LandingLocale) {
  return { url: shareImage(locale), width: 1200, height: 630, alt: LANDING_COPY[locale].meta.share.alt };
}

/** A day of a guide, written out as its language writes dates. */
function formatDay(day: string, locale: LandingLocale): string {
  return new Intl.DateTimeFormat(`${locale}-CH`, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(day));
}

function absolute(path: string): string {
  return new URL(path, SITE_URL).href;
}

export function guideMetadata(guide: Guide): Metadata {
  const translations = translationsOf(guide);
  const english = translations.find(translation => translation.locale === DEFAULT_LANDING_LOCALE);
  const image = share(guide.locale);
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: guidePath(guide),
      languages: translations.length > 1
        ? {
          ...Object.fromEntries(translations.map(translation => [translation.locale, guidePath(translation)])),
          ...(english ? { 'x-default': guidePath(english) } : {}),
        }
        : undefined,
    },
    openGraph: {
      type: 'article',
      url: guidePath(guide),
      siteName: SITE_NAME,
      title: guide.title,
      description: guide.description,
      locale: OPEN_GRAPH_LOCALES[guide.locale],
      publishedTime: guide.published,
      modifiedTime: guide.updated,
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.description, images: [image] },
  };
}

export function guideIndexMetadata(locale: LandingLocale): Metadata {
  const { index } = GUIDE_COPY[locale];
  const languages = indexLanguages();
  const image = share(locale);
  return {
    title: index.title,
    description: index.description,
    alternates: {
      canonical: guidesPath(locale),
      languages: {
        ...Object.fromEntries(languages.map(language => [language, guidesPath(language)])),
        'x-default': guidesPath(DEFAULT_LANDING_LOCALE),
      },
    },
    openGraph: {
      type: 'website',
      url: guidesPath(locale),
      siteName: SITE_NAME,
      title: index.title,
      description: index.description,
      locale: OPEN_GRAPH_LOCALES[locale],
      images: [image],
    },
    twitter: { card: 'summary_large_image', title: index.title, description: index.description, images: [image] },
  };
}

/** Who writes the guides, as the landing page names it. */
function organization() {
  return {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: [SOURCE_URL],
  };
}

/** The way from the site to the page, for a search engine: the trail above the headline. */
function breadcrumbs(locale: LandingLocale, guide?: Guide) {
  const steps = [
    { name: SITE_NAME, path: landingPath(locale) },
    { name: LANDING_COPY[locale].footer.guides, path: guidesPath(locale) },
    ...(guide ? [{ name: guide.name, path: guidePath(guide) }] : []),
  ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: step.name,
      item: absolute(step.path),
    })),
  };
}

/** What a guide tells a search engine in so many words: what it is, by whom, and the questions it answers. */
function guideStructuredData(guide: Guide) {
  const url = absolute(guidePath(guide));
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: guide.headline,
        description: guide.description,
        inLanguage: guide.locale,
        datePublished: guide.published,
        dateModified: guide.updated,
        image: absolute(shareImage(guide.locale)),
        author: { '@id': `${SITE_URL}/#organization` },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: url,
      },
      breadcrumbs(guide.locale, guide),
      ...(guide.faq.length > 0
        ? [{
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          inLanguage: guide.locale,
          mainEntity: guide.faq.map(({ question, answer }) => ({
            '@type': 'Question',
            name: question,
            acceptedAnswer: { '@type': 'Answer', text: plainText(answer) },
          })),
        }]
        : []),
    ],
  };
}

function indexStructuredData(locale: LandingLocale) {
  const { index } = GUIDE_COPY[locale];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organization(),
      {
        '@type': 'CollectionPage',
        '@id': `${absolute(guidesPath(locale))}#guides`,
        name: LANDING_COPY[locale].footer.guides,
        description: index.description,
        inLanguage: locale,
        url: absolute(guidesPath(locale)),
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: guidesIn(locale).map((guide, position) => ({
            '@type': 'ListItem',
            position: position + 1,
            url: absolute(guidePath(guide)),
            name: guide.name,
          })),
        },
      },
      breadcrumbs(locale),
    ],
  };
}

/** Structured data in its tag. Nothing in it can close the tag: "<" is written as its escape. */
function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

/** Words of a guide with their links and strong words. */
function Words({ text, locale }: { text: GuideText; locale: LandingLocale }) {
  return guideParts(text, locale).map((part, index) => {
    if (part.href) return <a key={index} href={part.href}>{part.text}</a>;
    if (part.strong) return <strong key={index}>{part.text}</strong>;
    return <Fragment key={index}>{part.text}</Fragment>;
  });
}

function Block({ block, locale }: { block: GuideBlock; locale: LandingLocale }) {
  if (typeof block === 'string') return <p><Words text={block} locale={locale} /></p>;
  if ('list' in block) {
    return <ul>{block.list.map(item => <li key={item}><Words text={item} locale={locale} /></li>)}</ul>;
  }
  if ('steps' in block) {
    return <ol className="steps">{block.steps.map(step => <li key={step}><Words text={step} locale={locale} /></li>)}</ol>;
  }
  if ('note' in block) return <p className="callout"><Words text={block.note} locale={locale} /></p>;

  const { caption, head, rows } = block.table;
  // A table wider than a phone scrolls on its own, and takes the focus to be scrolled from a keyboard.
  return (
    <div className="table" role="region" aria-label={caption} tabIndex={0}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>{head.map(cell => <th key={cell} scope="col">{cell}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.join()}>
              {row.map((cell, index) => (index === 0
                ? <th key={index} scope="row"><Words text={cell} locale={locale} /></th>
                : <td key={index}><Words text={cell} locale={locale} /></td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The trail above a headline: the site, the guides, and the page itself. */
function Trail({ locale, current }: { locale: LandingLocale; current?: string }) {
  const guides = LANDING_COPY[locale].footer.guides;
  return (
    <nav className="trail" aria-label={GUIDE_COPY[locale].trail}>
      <ol>
        <li><a href={landingPath(locale)}>{SITE_NAME}</a></li>
        {current
          ? <li><a href={guidesPath(locale)}>{guides}</a></li>
          : <li aria-current="page">{guides}</li>}
        {current && <li aria-current="page">{current}</li>}
      </ol>
    </nav>
  );
}

export function GuidePage({ guide }: { guide: Guide }) {
  const { locale } = guide;
  const copy = GUIDE_COPY[locale];
  const landing = LANDING_COPY[locale];
  const city = guide.city ? guideCity(guide.city) : undefined;
  const others = guidesIn(locale).filter(other => other !== guide);
  const updated = formatDay(guide.updated, locale);

  return (
    <>
      <StructuredData data={guideStructuredData(guide)} />
      <SiteBar
        locale={locale}
        home={landingPath(locale)}
        links={[{ href: guidesPath(locale), label: landing.footer.guides }]}
        languages={translationsOf(guide).map(translation => ({ locale: translation.locale, href: guidePath(translation) }))}
      />

      <main className="guide">
        <article>
          <header className="guide-head">
            <Trail locale={locale} current={guide.name} />
            <h1 className="title">{guide.headline}</h1>
            <p className="lede"><Words text={guide.lede} locale={locale} /></p>
            <p className="guide-meta">
              <time dateTime={guide.updated}>{copy.updated(updated)}</time>
              <span aria-hidden="true"> · </span>
              <span>{copy.reading(readingMinutes(guide))}</span>
            </p>
          </header>

          <nav className="contents" aria-labelledby="contents">
            <h2 id="contents">{copy.contents}</h2>
            <ol>
              {guide.sections.map(section => (
                <li key={section.heading}><a href={`#${sectionId(section.heading)}`}>{section.heading}</a></li>
              ))}
              {guide.faq.length > 0 && <li><a href="#faq">{copy.faq}</a></li>}
            </ol>
          </nav>

          {guide.sections.map(section => (
            <section key={section.heading} className="guide-section" aria-labelledby={sectionId(section.heading)}>
              <h2 id={sectionId(section.heading)}>{section.heading}</h2>
              {section.blocks.map((block, index) => <Block key={index} block={block} locale={locale} />)}
            </section>
          ))}

          <aside className="guide-map" aria-labelledby="find">
            <h2 id="find" className="heading">{copy.map.title}</h2>
            <p>{copy.map.text}</p>
            <div className="cta-row">
              <AppLink className="btn btn--white" href={city ? mapAt(city.center) : MAP_PATH}>{landing.openMap}</AppLink>
            </div>
          </aside>

          {guide.faq.length > 0 && (
            <section className="guide-section guide-faq" aria-labelledby="faq">
              <h2 id="faq">{copy.faq}</h2>
              <dl className="questions">
                {guide.faq.map(({ question, answer }) => (
                  <div className="question" key={question}>
                    <dt>{question}</dt>
                    <dd><Words text={answer} locale={locale} /></dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <footer className="guide-sources">
            <h2>{copy.sources}</h2>
            <ol>
              {guide.sources.map(source => <li key={source.url}><a href={source.url}>{source.title}</a></li>)}
            </ol>
            <p>{copy.disclaimer}</p>
          </footer>
        </article>

        {others.length > 0 && (
          <nav className="more" aria-labelledby="more">
            <h2 id="more">{copy.more}</h2>
            <GuideList guides={others} />
          </nav>
        )}
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}

function GuideList({ guides }: { guides: readonly Guide[] }) {
  return (
    <ul className="guide-list">
      {guides.map(guide => (
        <li key={guide.slug}>
          <a href={guidePath(guide)}>
            <span className="guide-list-name">{guide.name}</span>
            <span className="guide-list-text">{guide.description}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function GuideIndex({ locale }: { locale: LandingLocale }) {
  const copy = GUIDE_COPY[locale];
  const landing = LANDING_COPY[locale];
  return (
    <>
      <StructuredData data={indexStructuredData(locale)} />
      <SiteBar
        locale={locale}
        home={landingPath(locale)}
        links={[]}
        languages={indexLanguages().map(language => ({ locale: language, href: guidesPath(language) }))}
      />

      <main className="guide guide--index">
        <header className="guide-head">
          <Trail locale={locale} />
          <h1 className="title">{landing.footer.guides}</h1>
          <p className="lede">{copy.index.lede}</p>
        </header>
        <GuideList guides={guidesIn(locale)} />
      </main>

      <SiteFooter locale={locale} />
    </>
  );
}
