import type { AppLocale } from '@/lib/i18n';

// Numbers, clock times, prices and lists are written in the UI language as the
// visitor's region writes them: English as in the US ("11:05 PM", "$1.50") for
// a browser set to en-US, French as in Canada ("23 h 05", "1,50 $") for fr-CA.
// The region comes from the browser's own list of languages, never from the
// visitor's position. A browser whose first language the app is not shown in,
// as Israel's "he-IL, he, en-US, en" or Poland's "pl-PL, pl, en-US, en", gets
// the region of that first language: the English UI then writes metres,
// "17:05" and "₪5.50" in Israel, not the miles and "5:05 PM" of en-US.
// Switzerland stands in when the list names none for the UI language, which is
// what every visitor got before. iOS takes the device's region from the system.

/** The region of a visitor whose browser names none for the UI language, and of pages rendered on the server. */
export const DEFAULT_FORMAT_REGION = 'CH';

// The browser languages each UI language answers to: browsers write Norwegian
// Bokmål as nb, as the macro-language no, or, rarely, as Nynorsk.
const BROWSER_LANGUAGES: Readonly<Record<AppLocale, readonly string[]>> = {
  de: ['de'], fr: ['fr'], it: ['it'], nl: ['nl'], nb: ['nb', 'no', 'nn'], pt: ['pt'], es: ['es'], is: ['is'], en: ['en'],
};
const APP_LANGUAGES = new Set(Object.values(BROWSER_LANGUAGES).flat());

function parsedTag(tag: string): Intl.Locale | null {
  try {
    return new Intl.Locale(tag);
  } catch {
    return null;
  }
}

/**
 * The region the UI language is written as. Where the browser's first language
 * is one the app is not shown in, that language's region, or its likely one
 * when it names none: "IL" for he-IL or he, "JP" for ja, "PL" for pl-PL. Else
 * the region of the first browser language that is the UI language and names
 * one: "US" for English when the browser asks for en-US then fr-FR, "FR" for
 * French in the same browser, Switzerland when none does.
 */
export function formatRegion(language: AppLocale, requested: readonly string[]): string {
  const tags = requested.map(parsedTag).filter(tag => tag !== null);
  const [first] = tags;
  if (first && !APP_LANGUAGES.has(first.language)) {
    const region = first.region ?? first.maximize().region;
    if (region) return region;
  }
  const accepted = BROWSER_LANGUAGES[language];
  return tags.find(tag => tag.region && accepted.includes(tag.language))?.region ?? DEFAULT_FORMAT_REGION;
}

/**
 * The language the map's place names are written in where its tiles carry them:
 * the browser's first language where the app is not shown in it, "el" for
 * "el-GR, en-US" or "he" for "he-IL, he, en-US", and the UI language otherwise.
 */
export function placeNameLanguage(language: AppLocale, requested: readonly string[]): string {
  const first = requested.map(parsedTag).find(tag => tag !== null);
  return first && !APP_LANGUAGES.has(first.language) ? first.language : language;
}

/** The BCP 47 tag that formats for the UI language in the region: "en-US", "fr-CA", "de-CH". */
export function formatLocale(language: AppLocale, region: string = DEFAULT_FORMAT_REGION): string {
  return `${language}-${region}`;
}
