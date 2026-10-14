import type { AppLocale } from '@/lib/i18n';

// Numbers, clock times, prices and lists are written in the UI language as the
// visitor's region writes them: English as in the US ("11:05 PM", "$1.50") for
// a browser set to en-US, French as in Canada ("23 h 05", "1,50 $") for fr-CA.
// The region comes from the browser's own list of languages, never from the
// visitor's position, and Switzerland stands in when the list names none for
// the UI language, which is what every visitor got before. iOS takes the
// device's region from the system.

/** The region of a visitor whose browser names none for the UI language, and of pages rendered on the server. */
export const DEFAULT_FORMAT_REGION = 'CH';

// Browsers write Norwegian Bokmål as nb, as the macro-language no, or, rarely, as Nynorsk.
const BROWSER_LANGUAGES: Partial<Record<AppLocale, readonly string[]>> = { nb: ['nb', 'no', 'nn'] };

/**
 * The region of the first browser language that is the UI language and names a
 * region: "US" for English when the browser asks for en-US then fr-FR, "FR"
 * for French in the same browser, Switzerland when none does.
 */
export function formatRegion(language: AppLocale, requested: readonly string[]): string {
  const accepted = BROWSER_LANGUAGES[language] ?? [language];
  for (const tag of requested) {
    let parsed: Intl.Locale;
    try {
      parsed = new Intl.Locale(tag);
    } catch {
      continue;
    }
    if (parsed.region && accepted.includes(parsed.language)) return parsed.region;
  }
  return DEFAULT_FORMAT_REGION;
}

/** The BCP 47 tag that formats for the UI language in the region: "en-US", "fr-CA", "de-CH". */
export function formatLocale(language: AppLocale, region: string = DEFAULT_FORMAT_REGION): string {
  return `${language}-${region}`;
}
