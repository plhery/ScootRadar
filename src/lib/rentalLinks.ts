import { PROVIDERS, RENTAL_LINK_POLICIES } from '@/generated/providers';
import type { RentalUris, Vehicle } from '@/generated/scooterApi';

export type RentalPlatform = 'ios' | 'android' | 'web';

// Each operator's schemes and hosts are data/providers.json's rental (RENTAL_LINK_POLICIES), which both apps
// take too, without its website part.

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

  const policy = RENTAL_LINK_POLICIES[provider];
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
