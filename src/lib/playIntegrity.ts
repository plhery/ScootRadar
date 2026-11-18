import { fromBase64, utf8 } from '@/lib/bytes';

/**
 * Google Play Integrity's verdict on a classic request, as the Worker reads it (appPass.ts): the token is decrypted
 * and checked here, with the keys downloaded from Play Console (DEPLOY.md, "Map passes"), not sent to Google. It
 * is a JWE (A256KW, A256GCM) holding a JWS (ES256) of the verdict. It passes when it was asked by our app for our
 * challenge a few minutes ago, by a copy Google Play recognizes, on a device that meets Play's device integrity.
 */

export const SCOOTRADAR_PACKAGE = 'com.plhery.scootradar';
/** How old a verdict may be: as long as a challenge lives (appPass.ts). */
const VERDICT_MAX_AGE_MS = 5 * 60_000;
/** Labels of a genuine Android device that passes Play's checks; MEETS_STRONG_INTEGRITY comes with MEETS_DEVICE_INTEGRITY. */
const DEVICE_INTEGRITY = 'MEETS_DEVICE_INTEGRITY';

export type PlayIntegrityResult = { ok: true } | { ok: false; reason: string };

interface Verdict {
  requestDetails?: { requestPackageName?: unknown; nonce?: unknown; timestampMillis?: unknown };
  appIntegrity?: { appRecognitionVerdict?: unknown; packageName?: unknown };
  deviceIntegrity?: { deviceRecognitionVerdict?: unknown };
}

interface IntegrityInput {
  token: string;
  /** Play Console's decryption key: base64 of 32 bytes of AES. */
  decryptionKey: string;
  /** Play Console's verification key: base64 of an EC P-256 SubjectPublicKeyInfo. */
  verificationKey: string;
  /** The challenge the app passed as the request's nonce. */
  nonce: string;
  packageName?: string;
  now?: number;
}

/** The base64url nonce as bytes, whether Play gives it back padded or not. */
const nonceBytes = (nonce: unknown) => {
  if (typeof nonce !== 'string') return '';
  try {
    return Array.from(fromBase64(nonce)).join(',');
  } catch {
    return '';
  }
};

export async function verifyIntegrityToken({ token, decryptionKey, verificationKey, nonce, packageName = SCOOTRADAR_PACKAGE,
  now = Date.now() }: IntegrityInput): Promise<PlayIntegrityResult> {
  const encrypted = token.split('.');
  if (encrypted.length !== 5) return { ok: false, reason: 'format' };
  let jws: string;
  try {
    const [header, wrappedKey, iv, ciphertext, tag] = encrypted;
    const { alg, enc } = JSON.parse(new TextDecoder().decode(fromBase64(header))) as { alg?: unknown; enc?: unknown };
    if (alg !== 'A256KW' || enc !== 'A256GCM') return { ok: false, reason: 'format' };
    const wrapping = await crypto.subtle.importKey('raw', fromBase64(decryptionKey), 'AES-KW', false, ['unwrapKey']);
    const contentKey = await crypto.subtle.unwrapKey('raw', fromBase64(wrappedKey), wrapping, 'AES-KW', 'AES-GCM', false, ['decrypt']);
    const sealed = fromBase64(ciphertext);
    const sealedTag = fromBase64(tag);
    const both = new Uint8Array(sealed.length + sealedTag.length);
    both.set(sealed);
    both.set(sealedTag, sealed.length);
    jws = new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv), additionalData: utf8(header),
      tagLength: 128 }, contentKey, both));
  } catch {
    return { ok: false, reason: 'decrypt' };
  }
  const signed = jws.split('.');
  if (signed.length !== 3) return { ok: false, reason: 'format' };
  let verdict: Verdict;
  try {
    const { alg } = JSON.parse(new TextDecoder().decode(fromBase64(signed[0]))) as { alg?: unknown };
    const key = await crypto.subtle.importKey('spki', fromBase64(verificationKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    if (alg !== 'ES256' || !(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, fromBase64(signed[2]),
      utf8(`${signed[0]}.${signed[1]}`)))) return { ok: false, reason: 'signature' };
    verdict = JSON.parse(new TextDecoder().decode(fromBase64(signed[1]))) as Verdict;
  } catch {
    return { ok: false, reason: 'signature' };
  }
  const request = verdict.requestDetails;
  if (request?.requestPackageName !== packageName || !nonceBytes(nonce) || nonceBytes(request.nonce) !== nonceBytes(nonce)) {
    return { ok: false, reason: 'request' };
  }
  const askedAt = Number(request.timestampMillis);
  if (!Number.isFinite(askedAt) || now - askedAt > VERDICT_MAX_AGE_MS || askedAt - now > 60_000) return { ok: false, reason: 'stale' };
  const app = verdict.appIntegrity;
  if (app?.appRecognitionVerdict !== 'PLAY_RECOGNIZED' || app.packageName !== packageName) return { ok: false, reason: 'app' };
  const device = verdict.deviceIntegrity?.deviceRecognitionVerdict;
  if (!Array.isArray(device) || !device.includes(DEVICE_INTEGRITY)) return { ok: false, reason: 'device' };
  return { ok: true };
}
