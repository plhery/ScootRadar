import { decodeCbor, type CborValue } from '@/lib/cbor';
import { concat, fromBase64, sameBytes, sha256, utf8, type Bytes } from '@/lib/bytes';
import { octetStrings, parseCertificate, rawSignature, readDer, signedBy, type Certificate } from '@/lib/der';

/**
 * Apple's App Attest, as the Worker checks it (appPass.ts, after Apple's "Validating apps that connect to your
 * server"): an attestation proves a key was made by the Secure Enclave of an Apple device, for our app as Apple
 * signed it; an assertion, that the app holding that key signed a challenge of ours. The Worker keeps nothing:
 * it hands the app its key, signed, to show again (appPass.ts), so the assertion's counter is not compared with the
 * last one. A challenge lives five minutes and only on the network it was given to, which does the counter's work
 * against replays well enough here.
 */

/** Apple's App Attestation Root CA's key (https://www.apple.com/certificateauthority/Apple_App_Attestation_Root_CA.pem, valid until 2045). */
export const APPLE_APP_ATTESTATION_ROOT = 'MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdhNbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9auYen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41';
/** The iPhone app's App ID: its team and bundle identifier. */
export const SCOOTRADAR_APP_ID = 'HGC93X794T.com.plhery.scootradar';
/** The credential certificate's extension holding the nonce. */
const NONCE_EXTENSION = '1.2.840.113635.100.8.2';
/** App Attest's development environment (a build signed for development) and its production one (TestFlight, the App Store). */
const ENVIRONMENTS = ['appattestdevelop', 'appattest\0\0\0\0\0\0\0'].map(utf8);

export type AppAttestResult = { ok: true; publicKey: Bytes } | { ok: false; reason: string };
export type AppAssertResult = { ok: true } | { ok: false; reason: string };

const field = (value: CborValue, key: string) => value instanceof Map ? value.get(key) : undefined;
const bytesOf = (value: CborValue) => {
  if (!(value instanceof Uint8Array)) throw new Error('Not bytes');
  return value;
};

interface AttestationInput {
  /** The attestation object, as attestKey gave it. */
  attestation: Bytes;
  /** The key's identifier, as generateKey gave it: base64 of the SHA-256 of its public key. */
  keyId: string;
  /** What the app hashed for attestKey's clientDataHash: the challenge. */
  clientData: Bytes;
  appId?: string;
  root?: string;
  now?: number;
}

export async function verifyAttestation({ attestation, keyId, clientData, appId = SCOOTRADAR_APP_ID,
  root = APPLE_APP_ATTESTATION_ROOT, now = Date.now() }: AttestationInput): Promise<AppAttestResult> {
  let credential: Certificate, intermediate: Certificate, authData: Bytes, keyHash: Bytes;
  try {
    const object = decodeCbor(attestation);
    if (field(object, 'fmt') !== 'apple-appattest') return { ok: false, reason: 'format' };
    const chain = field(field(object, 'attStmt'), 'x5c');
    if (!Array.isArray(chain) || chain.length !== 2) return { ok: false, reason: 'format' };
    [credential, intermediate] = chain.map(certificate => parseCertificate(bytesOf(certificate)));
    authData = bytesOf(field(object, 'authData'));
    keyHash = fromBase64(keyId);
  } catch {
    return { ok: false, reason: 'format' };
  }
  // 1. The chain: the credential certificate from Apple's intermediate, the intermediate from Apple's root.
  if (![credential, intermediate].every(certificate => certificate.notBefore <= now && now <= certificate.notAfter)) {
    return { ok: false, reason: 'expired' };
  }
  try {
    if (!(await signedBy(intermediate, fromBase64(root), 'P-384'))
      || !(await signedBy(credential, intermediate.publicKey, intermediate.curve))) return { ok: false, reason: 'chain' };
  } catch {
    return { ok: false, reason: 'chain' };
  }
  // 2–4. The nonce the certificate holds is the hash of the authenticator data and of the challenge's hash.
  const nonce = await sha256(concat(authData, await sha256(clientData)));
  const extension = credential.extensions.get(NONCE_EXTENSION);
  let held: Bytes[] = [];
  try {
    held = extension ? octetStrings(extension, readDer(extension)) : [];
  } catch {
    held = [];
  }
  if (held.length !== 1 || !sameBytes(held[0], nonce)) return { ok: false, reason: 'nonce' };
  // 5. The key is the one the app named.
  if (credential.curve !== 'P-256' || !sameBytes(await sha256(credential.point), keyHash)) return { ok: false, reason: 'key' };
  // 6–9. The authenticator data: our app, a key never used, an environment of App Attest, and the key's identifier.
  if (authData.length < 55) return { ok: false, reason: 'format' };
  if (!sameBytes(authData.subarray(0, 32), await sha256(utf8(appId)))) return { ok: false, reason: 'app' };
  if (new DataView(authData.buffer, authData.byteOffset).getUint32(33) !== 0) return { ok: false, reason: 'counter' };
  const environment = authData.subarray(37, 53);
  if (!ENVIRONMENTS.some(known => sameBytes(known, environment))) return { ok: false, reason: 'environment' };
  const idLength = new DataView(authData.buffer, authData.byteOffset).getUint16(53);
  if (!sameBytes(authData.subarray(55, 55 + idLength), keyHash)) return { ok: false, reason: 'key' };
  return { ok: true, publicKey: credential.point.slice() };
}

interface AssertionInput {
  /** The assertion object, as generateAssertion gave it. */
  assertion: Bytes;
  /** The key's public point (0x04, x, y), from its attestation. */
  publicKey: Bytes;
  /** What the app hashed for generateAssertion's clientDataHash: the challenge. */
  clientData: Bytes;
  appId?: string;
}

export async function verifyAssertion({ assertion, publicKey, clientData, appId = SCOOTRADAR_APP_ID }: AssertionInput): Promise<AppAssertResult> {
  let signature: Bytes, authData: Bytes;
  try {
    const object = decodeCbor(assertion);
    signature = rawSignature(bytesOf(field(object, 'signature')), 32);
    authData = bytesOf(field(object, 'authenticatorData'));
  } catch {
    return { ok: false, reason: 'format' };
  }
  if (authData.length < 37) return { ok: false, reason: 'format' };
  // 1–3. The key signed the hash of the authenticator data and of the challenge's hash.
  const nonce = await sha256(concat(authData, await sha256(clientData)));
  let signed = false;
  try {
    const key = await crypto.subtle.importKey('raw', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    signed = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, signature, nonce);
  } catch {
    signed = false;
  }
  if (!signed) return { ok: false, reason: 'signature' };
  // 4. For our app. 5. A key's counter starts at 0, and each assertion raises it.
  if (!sameBytes(authData.subarray(0, 32), await sha256(utf8(appId)))) return { ok: false, reason: 'app' };
  if (new DataView(authData.buffer, authData.byteOffset).getUint32(33) === 0) return { ok: false, reason: 'counter' };
  return { ok: true };
}
