// The second seat of the languages in the bar of the site, src/app/(site)/chrome.tsx:
// the language we guess the visitor reads, other than the page's. The page is
// built once for everyone, with the guess for a visitor we know nothing about;
// the Worker, worker.ts, makes it again for each visitor as the page goes out,
// from what their browser asks for and where they are. It has nothing to
// import, so the Worker carries only this.

/** Why a language was guessed: the visitor's browser asks for it, it is spoken where they are, or neither told us anything. */
export type GuessReason = 'browser' | 'place' | 'default';

export interface LanguageGuess<L extends string> {
  locale: L;
  reason: GuessReason;
}

/**
 * The languages a browser asks for, most wanted first, as codes without their
 * region: "de-CH,de;q=0.9,en;q=0.8" is de, de, en. Norwegian is asked for as
 * "no" or "nn" as often as "nb", and the site's Norwegian is the nearest of all.
 */
export function browserLanguages(header: string | null | undefined): string[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...parameters] = part.split(';').map(piece => piece.trim());
      const weight = parameters.find(parameter => parameter.startsWith('q='));
      const quality = weight === undefined ? 1 : Number(weight.slice(2));
      return { tag, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter(({ tag, quality }) => tag && tag !== '*' && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map(({ tag }) => {
      const language = tag.toLowerCase().split(/[-_]/)[0];
      return language === 'no' || language === 'nn' ? 'nb' : language;
    });
}

// The languages of the site spoken in a country, the most spoken first. Only
// the site's languages are named; a country of none of them has no entry.
const COUNTRY_LANGUAGES: Readonly<Record<string, readonly string[]>> = {
  AT: ['de'],
  DE: ['de'],
  LI: ['de'],
  CH: ['de', 'fr', 'it'],
  FR: ['fr'],
  MC: ['fr'],
  LU: ['fr', 'de'],
  BE: ['nl', 'fr'],
  IT: ['it'],
  SM: ['it'],
  VA: ['it'],
  NL: ['nl'],
  SR: ['nl'],
  NO: ['nb'],
  SJ: ['nb'],
  IS: ['is'],
  PT: ['pt'],
  BR: ['pt'],
  AO: ['pt'],
  MZ: ['pt'],
  CV: ['pt'],
  ES: ['es'],
  AD: ['es'],
  MX: ['es'],
  AR: ['es'],
  CO: ['es'],
  CL: ['es'],
  PE: ['es'],
  VE: ['es'],
  EC: ['es'],
  GT: ['es'],
  CU: ['es'],
  BO: ['es'],
  DO: ['es'],
  HN: ['es'],
  PY: ['es'],
  SV: ['es'],
  NI: ['es'],
  CR: ['es'],
  PA: ['es'],
  UY: ['es'],
  PR: ['es', 'en'],
  GQ: ['es'],
  GB: ['en'],
  IE: ['en'],
  US: ['en'],
  CA: ['en', 'fr'],
  AU: ['en'],
  NZ: ['en'],
  MT: ['en'],
};

// Where a country speaks other languages in one part than in the rest, by the
// code of the part (ISO 3166-2, without the country). Switzerland by canton:
// French in the west, Italian in Ticino, both of the languages of a canton
// that has two, and German everywhere else.
const REGION_LANGUAGES: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  CH: {
    GE: ['fr'],
    VD: ['fr'],
    NE: ['fr'],
    JU: ['fr'],
    FR: ['fr', 'de'],
    VS: ['fr', 'de'],
    BE: ['de', 'fr'],
    GR: ['de', 'it'],
    TI: ['it'],
  },
  BE: { BRU: ['fr', 'nl'], WAL: ['fr'], VLG: ['nl'] },
  CA: { QC: ['fr', 'en'] },
};

/** The languages of the site spoken where the visitor is, from the country and its region as Cloudflare gives them. */
export function placeLanguages(country: string | null | undefined, region?: string | null): readonly string[] {
  if (!country) return [];
  const code = country.toUpperCase();
  const regional = region ? REGION_LANGUAGES[code]?.[region.toUpperCase()] : undefined;
  if (regional) return regional;
  if (code === 'CH' && region) return ['de'];
  return COUNTRY_LANGUAGES[code] ?? [];
}

/**
 * The language to offer beside the page's, among those the page is in:
 * the first the browser asks for, else one spoken where the visitor is,
 * else English. None when English is the page's own or the page has none:
 * the bar then has no second seat rather than one picked at random.
 */
export function guessLanguage<L extends string>({ page, available, acceptLanguage, country, region }: {
  page: L;
  available: readonly L[];
  acceptLanguage?: string | null;
  country?: string | null;
  region?: string | null;
}): LanguageGuess<L> | undefined {
  const offered = (language: string): language is L => language !== page && (available as readonly string[]).includes(language);

  const asked = browserLanguages(acceptLanguage).find(offered);
  if (asked) return { locale: asked, reason: 'browser' };

  const spoken = placeLanguages(country, region).find(offered);
  if (spoken) return { locale: spoken, reason: 'place' };

  const english: string = 'en';
  if (offered(english)) return { locale: english, reason: 'default' };
  return undefined;
}
