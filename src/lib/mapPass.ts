/**
 * The web map's pass: a cookie the Worker sets once Cloudflare Turnstile has found the browser is not a script
 * (mapPassEndpoint.ts), which makes its requests for scooters a verified client's (scooterClient.ts). It holds
 * no identifier: when it expires, and a signature of that time and of the visitor's network (an IPv4 address or
 * an IPv6 /64, clientNetwork.ts), so it is no use from another network. The key is the Worker's MAP_PASS_SECRET.
 */
export const MAP_PASS_COOKIE = '__Host-scootradar-pass';
export const MAP_PASS_SECONDS = 24 * 60 * 60;
/** Set on an answer for scooters to a request without a valid pass, so the web map asks for one (mapPassClient.ts). */
export const MAP_PASS_HEADER = 'X-Scooter-Pass';
/** Where the web map asks for its pass (mapPassEndpoint.ts). */
export const MAP_PASS_PATH = '/api/pass';
/** The action the web map's Turnstile widget names, which the Worker checks on its token. */
export const MAP_PASS_ACTION = 'map';

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer) {
  let text = '';
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function signature(secret: string, expiresAt: number, network: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(`scootradar-map-pass:1:${expiresAt}:${network}`)));
}

/** The cookie's value: its expiry, in seconds since 1970, and its signature. */
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

/** Whether the request's Cookie header holds a pass for this network that has not expired. */
export async function holdsMapPass(cookieHeader: string | null, secret: string | undefined, network: string, now = Date.now()) {
  const value = secret ? cookieValue(cookieHeader, MAP_PASS_COOKIE) : undefined;
  const match = value?.match(/^(\d{10})\.([A-Za-z0-9_-]{43})$/);
  if (!secret || !match) return false;
  const expiresAt = Number(match[1]);
  if (expiresAt * 1000 <= now || expiresAt * 1000 > now + MAP_PASS_SECONDS * 1000) return false;
  const expected = await signature(secret, expiresAt, network);
  // Compared whole: both are 43 characters.
  let difference = 0;
  for (let i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ match[2].charCodeAt(i);
  return difference === 0;
}
