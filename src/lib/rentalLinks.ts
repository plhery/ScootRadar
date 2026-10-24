import { PROVIDERS } from '@/generated/providers';
import type { RentalUris, Vehicle } from '@/generated/scooterApi';

export type RentalPlatform = 'ios' | 'android' | 'web';

interface ProviderRentalLinkPolicy {
  schemes: readonly string[];
  httpsHosts: readonly string[];
  /** Links whose query names the vehicle for good, past the id the feed rotates. */
  withoutQuery?: boolean;
}

const PROVIDER_LINK_POLICIES: Record<string, ProviderRentalLinkPolicy> = {
  bolt: {
    schemes: ['bolt'],
    httpsHosts: ['bolt.eu', 'bolt.com'],
  },
  bird: {
    schemes: ['bird'],
    httpsHosts: ['bird.co', 'birdapp.com', 'birdapp.app.link'],
  },
  dott: {
    schemes: ['dott', 'ridedott'],
    httpsHosts: ['ridedott.com'],
  },
  hopp: {
    schemes: ['hopp'],
    httpsHosts: ['hopp.bike'],
  },
  lime: {
    schemes: ['lime', 'limebike'],
    httpsHosts: ['li.me', 'lime.bike', 'limebike.com'],
  },
  voi: {
    schemes: ['voiapp'],
    httpsHosts: ['voi.com', 'voiscooters.com', 'lqfa.adj.st'],
  },
  publibike: {
    schemes: ['publibike', 'velospot'],
    httpsHosts: ['publibike.ch', 'velospot.info'],
  },
  pony: {
    schemes: ['co.ponybikes.mercury', 'co.ponybikes.venus'],
    httpsHosts: ['getapony.com'],
  },
  zeus: {
    schemes: [],
    httpsHosts: ['zeus.city', 'ridezeus.app.link'],
  },
  beryl: {
    schemes: ['beryl-basis'],
    httpsHosts: ['beryl.app', 'beryl.cc'],
  },
  // Ryde's link carries the scooter's IMEI; without it the page still sends the rider to the app.
  ryde: {
    schemes: ['rydelink', 'ryde-linking'],
    httpsHosts: ['ryde.vip'],
    withoutQuery: true,
  },
  hoppy: {
    schemes: [],
    httpsHosts: ['ride-hoppy.app.link', 'behoppy.eu'],
  },
  qick: {
    schemes: [],
    httpsHosts: ['qickscooters.app.link', 'qickscooters.com'],
  },
  // Ride Mobility runs on ATOM Mobility, as Hoppy does, and links each scooter the same way.
  ride_mobility: {
    schemes: [],
    httpsHosts: ['ridemobility.app.link', 'ridemobility.eu'],
  },
  // Yoio is on ATOM Mobility too: its links name each scooter by the number it carries, not by hardware.
  yoio: {
    schemes: [],
    httpsHosts: ['rideyoio.app.link', 'yoio.app'],
  },
  // Elerent too, and its links name each scooter by the code it carries, such as CAT0059 in Catania.
  elerent: {
    schemes: [],
    httpsHosts: ['elerent.app.link', 'elerent.com'],
  },
  // 3electra too, in Kyiv: its links end in the code on the scooter, such as Z3106.
  zelectra: {
    schemes: [],
    httpsHosts: ['zelectra.app.link', '3electra.com.ua'],
  },
  // Spin's feeds give no link of their own, and their app's, as Bird's, is the charger sign-up.
  // Its "Open in" button is its site, www.spin.app, which no app claims.
  spin: {
    schemes: [],
    httpsHosts: ['spin.app', 'spin.pm'],
  },
  // Veo's links are Adjust links that open its app on the scooter's number.
  veo: {
    schemes: [],
    httpsHosts: ['gmjc.adj.st', 'veoride.com'],
  },
  // Lyft gives every scooter of a city one link, which opens its app's code scanner: chi.lft.to
  // in Chicago, lyft.biketownpdx.com in Portland.
  lyft: {
    schemes: [],
    httpsHosts: ['lft.to', 'lyft.com', 'biketownpdx.com'],
  },
  // Bolt runs its scooters in Washington, DC as Hopp, in an app of that name: bolt-hopp://.
  bolt_hopp: {
    schemes: ['bolt-hopp'],
    httpsHosts: ['gethopp.com'],
  },
  // SAHAM, in Riyadh, is on ATOM Mobility too: its links end in the number on the scooter, such as 0131.
  saham: {
    schemes: [],
    httpsHosts: ['ride-saham.app.link', 'sahamofficial.com'],
  },
  // Flamingo, in New Zealand, links each scooter on ride.flamingoscooters.com: /vehicle/<id> for
  // iPhones, /v/<id> for Android, so no one link serves both and the web gets none.
  flamingo: {
    schemes: [],
    httpsHosts: ['flamingoscooters.com'],
  },
  // JOLT, in New Plymouth and Rolleston, links each scooter by a uuid on its own site.
  jolt: {
    schemes: [],
    httpsHosts: ['joltscooters.co.nz'],
  },
};

// Links that open an operator's app elsewhere than on a scooter. Bird's and Spin's feeds give
// bird://charger-onboarding as their app's address, the sign-up for people who charge scooters.
const NOT_RENTAL_LINKS: readonly { scheme: string; host: string }[] = [{ scheme: 'bird', host: 'charger-onboarding' }];

const UNSAFE_CHARACTERS = /[\u0000-\u001f\u007f]/;
const MAX_RENTAL_URI_LENGTH = 2_048;

function matchesHost(hostname: string, allowedHost: string): boolean {
  return hostname === allowedHost || hostname.endsWith(`.${allowedHost}`);
}

export function safeRentalUri(
  provider: string,
  value: unknown,
  options: { httpsOnly?: boolean } = {}
): string | null {
  if (typeof value !== 'string') return null;

  const candidate = value.trim();
  if (
    candidate.length === 0 ||
    candidate.length > MAX_RENTAL_URI_LENGTH ||
    UNSAFE_CHARACTERS.test(candidate)
  ) return null;

  const policy = PROVIDER_LINK_POLICIES[provider];
  if (!policy) return null;

  try {
    const url = new URL(candidate);
    if (url.username || url.password) return null;

    const scheme = url.protocol.slice(0, -1).toLowerCase();
    if (NOT_RENTAL_LINKS.some(link => link.scheme === scheme && link.host === url.hostname.toLowerCase())) return null;
    if (scheme === 'https') {
      const hostname = url.hostname.toLowerCase();
      if (url.port || !policy.httpsHosts.some(host => matchesHost(hostname, host))) return null;
      if (policy.withoutQuery) url.search = '';
      return url.toString();
    }

    if (options.httpsOnly || !policy.schemes.includes(scheme)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeRentalUris(
  provider: string,
  rentalUris: { ios?: unknown; android?: unknown; web?: unknown } | null | undefined,
  universalFallback?: unknown
): RentalUris {
  const fallback = safeRentalUri(provider, universalFallback);
  const webFallback = fallback?.startsWith('https:') ? fallback : null;

  return {
    ios: safeRentalUri(provider, rentalUris?.ios) ?? fallback,
    android: safeRentalUri(provider, rentalUris?.android) ?? fallback,
    web: safeRentalUri(provider, rentalUris?.web, { httpsOnly: true }) ?? webFallback,
  };
}

export function legacyRentalLink(rentalUris: RentalUris): string | null {
  if (rentalUris.web) return rentalUris.web;
  if (
    rentalUris.ios &&
    rentalUris.ios === rentalUris.android &&
    rentalUris.ios.startsWith('https:')
  ) return rentalUris.ios;
  return null;
}

export function rentalPlatform(
  userAgent: string,
  maximumTouchPoints = 0
): RentalPlatform {
  if (/android/i.test(userAgent)) return 'android';
  if (
    /iPad|iPhone|iPod/i.test(userAgent) ||
    (/Macintosh/i.test(userAgent) && maximumTouchPoints > 1)
  ) return 'ios';
  return 'web';
}

export function rentalLinkForPlatform(
  vehicle: Vehicle,
  platform: RentalPlatform
): string | null {
  const rentalUris = vehicle.rental_uris;
  const candidates = platform === 'ios'
    ? [rentalUris?.ios, rentalUris?.web, vehicle.deep_link]
    : platform === 'android'
      ? [rentalUris?.android, rentalUris?.web, vehicle.deep_link]
      : [rentalUris?.web, vehicle.deep_link];

  for (const candidate of candidates) {
    const safe = safeRentalUri(vehicle.provider, candidate, { httpsOnly: platform === 'web' });
    if (safe) return safe;
  }
  return null;
}

/**
 * Where the feed links no scooter, as Lime's and Bird's never do, a phone still opens the
 * operator's app: on its universal link, whose page sends a phone without the app to the app's
 * store. Spin's app claims no link, so its site opens, which links both stores. A computer has no
 * app to open.
 */
export function operatorAppLink(provider: string, platform: RentalPlatform): string | null {
  return platform === 'web' ? null : PROVIDERS[provider]?.app?.link ?? null;
}

export function browserRentalLink(
  vehicle: Vehicle,
  userAgent: string,
  maximumTouchPoints = 0
): string | null {
  return rentalLinkForPlatform(
    vehicle,
    rentalPlatform(userAgent, maximumTouchPoints)
  );
}
