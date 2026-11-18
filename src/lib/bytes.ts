/** Bytes as the passes read and write them (mapPass.ts, appPass.ts): base64 of either alphabet, hashes, comparisons. */

/** Bytes WebCrypto takes: of an ArrayBuffer, not a shared one. */
export type Bytes = Uint8Array<ArrayBuffer>;

export function base64url(bytes: ArrayBuffer | Uint8Array): string {
  let text = '';
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Base64 of either alphabet, padded or not; throws on anything else. */
export function fromBase64(text: string): Bytes {
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(text)) throw new Error('Not base64');
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/').replace(/=+$/, ''));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export const utf8 = (text: string) => new TextEncoder().encode(text);

export function concat(...parts: Uint8Array[]): Bytes {
  const joined = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    joined.set(part, at);
    at += part.length;
  }
  return joined;
}

export const sha256 = async (bytes: Bytes) => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));

/** Compared whole, whatever differs first. */
export function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function hmac(secret: string, message: string): Promise<Bytes> {
  const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(message)));
}
