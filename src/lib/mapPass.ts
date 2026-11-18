import { base64url, hmac, sameBytes, utf8 } from '@/lib/bytes';

/**
 * The map's pass: the web map holds it as a cookie the Worker sets once Cloudflare Turnstile has found the browser
 * is not a script (mapPassEndpoint.ts), and the apps in the X-Scooter-Pass header once App Attest or Play
 * Integrity has found them ours (appPass.ts). It makes their requests for scooters a verified client's
 * (scooterClient.ts). It holds no identifier: when it expires, and a signature of that time and of the visitor's
 * network (an IPv4 address or an IPv6 /64, clientNetwork.ts), so it is no use from another network. The key is
 * the Worker's MAP_PASS_SECRET.
 */
export const MAP_PASS_COOKIE = '__Host-scootradar-pass';
export const MAP_PASS_SECONDS = 24 * 60 * 60;
/**
 * An app's request for scooters carries its pass in it. An answer for scooters to a request without a valid pass
 * says `none` in it, so the map asks for one (mapPassClient.ts, the apps).
 */
export const MAP_PASS_HEADER = 'X-Scooter-Pass';
/** Where the maps ask for their pass (mapPassEndpoint.ts). */
export const MAP_PASS_PATH = '/api/pass';
/** The action the web map's Turnstile widget names, which the Worker checks on its token. */
export const MAP_PASS_ACTION = 'map';

const signature = async (secret: string, expiresAt: number, network: string) =>
  base64url(await hmac(secret, `scootradar-map-pass:1:${expiresAt}:${network}`));

/** The pass: its expiry, in seconds since 1970, and its signature. */
export async function issueMapPass(secret: string, network: string, now = Date.now()): Promise<string> {
  const expiresAt = Math.floor(now / 1000) + MAP_PASS_SECONDS;
  return `${expiresAt}.${await signature(secret, expiresAt, network)}`;
}

export function mapPassCookie(value: string) {
  return `${MAP_PASS_COOKIE}=${value}; Max-Age=${MAP_PASS_SECONDS}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

function cookieValue(header: string | null, name: string) {
  for (const part of header?.split(';') ?? []) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

/** Whether the pass is one for this network that has not expired. */
export async function validMapPass(value: string | null | undefined, secret: string | undefined, network: string, now = Date.now()) {
  const match = value?.match(/^(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!secret || !match) return false;
  const expiresAt = Number(match[1]);
  if (expiresAt * 1000 <= now || expiresAt * 1000 > now + MAP_PASS_SECONDS * 1000) return false;
  return sameBytes(utf8(match[2]), utf8(await signature(secret, expiresAt, network)));
}

/** Whether the request's Cookie header holds a pass for this network that has not expired. */
export async function holdsMapPass(cookieHeader: string | null, secret: string | undefined, network: string, now = Date.now()) {
  return validMapPass(cookieValue(cookieHeader, MAP_PASS_COOKIE), secret, network, now);
}
