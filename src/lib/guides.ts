// The guides: what riders ask a search engine before they ride, answered at
// length, one page each. Their words are in src/guides, a file per guide; this
// is what a guide is made of and where it lives on the site.
//
// A guide is written in one language. The same guide in other languages has
// the same topic, so each tells a search engine where the others are. The words
// follow the rules of the landing page (src/lib/landingCopy.ts): apostrophes
// written as apostrophes, German the Swiss way, French with a no-break space
// before its double punctuation.

import { GUIDES } from '@/guides';
import { COVERED_CITIES } from '@/lib/coveredCities';
import { DEFAULT_LANDING_LOCALE, LANDING_LOCALES, type LandingLocale } from '@/lib/landingCopy';
import { mapAt } from '@/lib/mapAddress';

/**
 * Words with links and emphasis in them. A link is written [the words](where),
 * where is an address of the site, an address elsewhere, "map:" and the id of a
 * city of src/lib/coveredCities.ts for the map opened there, or "guide:" and a
 * topic for the guide on it in the same language. Words between ** are strong.
 */
export type GuideText = string;

/** What a section is made of, one after the other. A string is a paragraph. */
export type GuideBlock =
  | GuideText
  | { list: readonly GuideText[] }
  | { steps: readonly GuideText[] }
  | { table: { caption: string; head: readonly string[]; rows: readonly (readonly GuideText[])[] } }
  /** Something to keep in mind, set apart from the paragraphs around it. */
  | { note: GuideText };

export interface GuideSection {
  heading: string;
  blocks: readonly GuideBlock[];
}

export interface Guide {
  locale: LandingLocale;
  /** The last part of its address, in its language: lower case, words joined by hyphens. */
  slug: string;
  /** The same in every language the guide is written in. */
  topic: string;
  /** What a list of guides and a link to this one call it. */
  name: string;
  /** The title a search engine shows, 60 characters at most. */
  title: string;
  /** What a search engine shows under the title, 110 to 160 characters. */
  description: string;
  headline: string;
  /** The short answer, under the headline. */
  lede: GuideText;
  /** Days, written YYYY-MM-DD. */
  published: string;
  updated: string;
  /** Where the map opens from the guide's own button: the id of a city it is about. */
  city?: string;
  sections: readonly GuideSection[];
  faq: readonly { question: string; answer: GuideText }[];
  sources: readonly { title: string; url: string }[];
}

/** The word of the guides' addresses, in each language: what its footer calls them. */
export const GUIDES_SEGMENT: Record<LandingLocale, string> = {
  en: 'guides',
  de: 'ratgeber',
  fr: 'guides',
  it: 'guide',
  nl: 'gidsen',
  nb: 'guider',
  pt: 'guias',
  es: 'guias',
  is: 'leidarvisar',
};

/** Where the guides of a language are listed. English has no code in its addresses. */
export function guidesPath(locale: LandingLocale): string {
  const prefix = locale === DEFAULT_LANDING_LOCALE ? '' : `/${locale}`;
  return `${prefix}/${GUIDES_SEGMENT[locale]}`;
}

export function guidePath(guide: Guide): string {
  return `${guidesPath(guide.locale)}/${guide.slug}`;
}

/** The guides of a language, the ones to read first at the top. */
export function guidesIn(locale: LandingLocale): Guide[] {
  return GUIDES.filter(guide => guide.locale === locale);
}

export function guideOf(locale: LandingLocale, slug: string): Guide | undefined {
  return GUIDES.find(guide => guide.locale === locale && guide.slug === slug);
}

/** The guide in each language it is written in, itself included, in the order of the languages. */
export function translationsOf(guide: Guide): Guide[] {
  return LANDING_LOCALES.flatMap(locale =>
    GUIDES.filter(other => other.topic === guide.topic && other.locale === locale));
}

/** A city of the catalogue, by its id. */
export function guideCity(id: string) {
  return COVERED_CITIES.find(city => city.id === id);
}

/** Where a link of a guide in this language leads, as written in its words. */
export function guideHref(where: string, locale: LandingLocale): string {
  if (where.startsWith('map:')) {
    const city = guideCity(where.slice('map:'.length));
    if (!city) throw new Error(`No city ${where} in the catalogue`);
    return mapAt(city.center);
  }
  if (where.startsWith('guide:')) {
    const topic = where.slice('guide:'.length);
    const guide = GUIDES.find(other => other.topic === topic && other.locale === locale);
    if (!guide) throw new Error(`No guide on ${topic} in ${locale}`);
    return guidePath(guide);
  }
  return where;
}

export interface GuidePart {
  text: string;
  href?: string;
  strong?: boolean;
}

// An address may hold brackets of its own, as the city fr:Marne-la-Vallée (SIEMU) does.
const MARKS = /\[([^\]]+)\]\(((?:[^()]|\([^()]*\))+)\)|\*\*(.+?)\*\*/g;

/** Words of a guide cut at their links and their strong words. */
export function guideParts(text: GuideText, locale: LandingLocale): GuidePart[] {
  const parts: GuidePart[] = [];
  let read = 0;
  for (const mark of text.matchAll(MARKS)) {
    parts.push({ text: text.slice(read, mark.index) });
    parts.push(mark[3] === undefined
      ? { text: mark[1], href: guideHref(mark[2], locale) }
      : { text: mark[3], strong: true });
    read = mark.index + mark[0].length;
  }
  return [...parts, { text: text.slice(read) }].filter(part => part.text);
}

/** The words alone, for what is read without the page: a search engine's answers, a count of words. */
export function plainText(text: GuideText): string {
  return text.replace(MARKS, (_, linked: string | undefined, _where, strong: string | undefined) => linked ?? strong ?? '');
}

/** Every piece of words of a guide, in the order they are read. */
export function guideTexts(guide: Guide): GuideText[] {
  return [
    guide.headline,
    guide.lede,
    ...guide.sections.flatMap(section => [section.heading, ...section.blocks.flatMap(blockTexts)]),
    ...guide.faq.flatMap(({ question, answer }) => [question, answer]),
  ];
}

function blockTexts(block: GuideBlock): GuideText[] {
  if (typeof block === 'string') return [block];
  if ('list' in block) return [...block.list];
  if ('steps' in block) return [...block.steps];
  if ('note' in block) return [block.note];
  return [block.table.caption, ...block.table.head, ...block.table.rows.flat()];
}

/** How long the guide takes to read, in minutes, at 220 words a minute. */
export function readingMinutes(guide: Guide): number {
  const words = guideTexts(guide).map(plainText).join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

/** The anchor of a section, from its heading: letters without accents, words joined by hyphens. */
export function sectionId(heading: string): string {
  return heading
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'a')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** A guide as the footer of the landing page links to it. */
export interface LandingGuide {
  title: string;
  href: string;
}

/**
 * The guides each language's footer lists, the ones to read first at the top,
 * and the list of all of them last, under the name the footer gives it.
 */
export function landingGuides(locale: LandingLocale, all: string): LandingGuide[] {
  const guides = guidesIn(locale);
  if (guides.length === 0) return [];
  return [
    ...guides.map(guide => ({ title: guide.name, href: guidePath(guide) })),
    { title: all, href: guidesPath(locale) },
  ];
}
