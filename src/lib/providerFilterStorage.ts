/**
 * The providers a visitor turned off in the map's filters, as the browser keeps them. The ones turned off, not
 * those on, as the Android app keeps them: a provider the map adds later is on for everyone until they turn it off,
 * but for a visitor with exactly one on (PROVIDER_ONLY_STORAGE_KEY).
 */
export const PROVIDERS_OFF_STORAGE_KEY = 'scooters-providers-off';

/**
 * The one provider on, while exactly one of the map's is, and nothing otherwise: a visitor who turned every other
 * provider off has said what they want, and the providers the map adds later stay off for them, as in the iPhone and
 * Android apps. Read ahead of the list of those off.
 */
export const PROVIDER_ONLY_STORAGE_KEY = 'scooters-provider-only';

/**
 * Until 4 November 2026 the map kept the providers that were on, and wrote them on every visit, filters touched or
 * not: a visitor's list was every provider of their first visit, and those added after it stayed off. Since 11
 * October 2026 the map has gone from 8 providers to 40, and none has left it.
 */
export const LEGACY_PROVIDERS_STORAGE_KEY = 'scooters-providers';

/**
 * Written with every save since 14 November 2026. A list of those off kept without it was written against the 40
 * providers below, and if it leaves exactly one of them on and no one-provider key was kept with it, that one is the
 * only provider on: the visitor kept one app before the map kept that choice (d0bd77ea, 10 November 2026) and has not
 * come back since. Only once: after that save, a list leaving one of the 40 on is a choice made beside a provider
 * added later.
 */
export const PROVIDERS_OFF_CHECKED_STORAGE_KEY = 'scooters-providers-off-v2';

/** The map's 40 providers from before 10 November 2026 to 14 November 2026, the most a list without the flag can name. */
export const PROVIDERS_OF_NOVEMBER_2026: readonly string[] = [
  'alpaca', 'beam', 'beryl', 'binbin', 'bird', 'bolt', 'bolt_hopp', 'dart', 'deer', 'dott', 'elerent', 'flamingo', 'gcoo',
  'hopp', 'hoppy', 'jet', 'jolt', 'kickgoing', 'lime', 'luup', 'lyft', 'move', 'naolib', 'pony', 'publibike', 'qick',
  'ride_mobility', 'ridemovi', 'ryde', 'saham', 'spin', 'swing', 'veo', 'voi', 'whoosh', 'xingxing', 'yoio', 'zelectra',
  'zeus', 'zippy',
];

/** The map's providers until 11 October 2026, the only ones a visitor could have turned off on purpose since the first. */
const PROVIDERS_BEFORE_11_OCTOBER_2026: readonly string[] = ['bird', 'bolt', 'dott', 'hopp', 'lime', 'pony', 'publibike', 'voi'];

const stringList = (raw: string | null): string[] | null => {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) && value.every(item => typeof item === 'string') ? value : null;
  } catch {
    return null;
  }
};

/**
 * The providers kept off, among those the map has; null where none were kept. Every one but the one kept on, where
 * that is one the map has, or the one of the 40 a list kept before the flag left on. A legacy list of those on counts as turning off only the providers of before 11 October
 * 2026 it lacks: one written on a visit since then also lacks the providers added after it, which nobody had turned off.
 */
export function savedProvidersOff(read: (key: string) => string | null, providers: readonly string[]): Set<string> | null {
  const only = read(PROVIDER_ONLY_STORAGE_KEY);
  if (only !== null && providers.includes(only)) return new Set(providers.filter(provider => provider !== only));
  const off = stringList(read(PROVIDERS_OFF_STORAGE_KEY));
  if (off) {
    if (read(PROVIDERS_OFF_CHECKED_STORAGE_KEY) === null) {
      const on = PROVIDERS_OF_NOVEMBER_2026.filter(provider => !off.includes(provider));
      if (on.length === 1 && providers.includes(on[0])) return new Set(providers.filter(provider => provider !== on[0]));
    }
    return new Set(off.filter(provider => providers.includes(provider)));
  }
  const on = stringList(read(LEGACY_PROVIDERS_STORAGE_KEY));
  if (!on || !on.every(provider => providers.includes(provider))) return null;
  return new Set(PROVIDERS_BEFORE_11_OCTOBER_2026.filter(provider => providers.includes(provider) && !on.includes(provider)));
}

/** What to keep: the providers not shown, sorted. */
export const providersOffToSave = (providers: readonly string[], shown: ReadonlySet<string>): string =>
  JSON.stringify(providers.filter(provider => !shown.has(provider)).sort());

/** The one provider to keep as the only one on: of all the map's, not only those of the area shown; null for any other number. */
export function providerOnlyToSave(providers: readonly string[], shown: ReadonlySet<string>): string | null {
  const on = providers.filter(provider => shown.has(provider));
  return on.length === 1 ? on[0] : null;
}
