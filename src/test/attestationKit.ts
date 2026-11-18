import { SCOOTRADAR_APP_ID } from '@/lib/appAttest';
import { base64url, concat, sha256, utf8, type Bytes } from '@/lib/bytes';
import { SCOOTRADAR_PACKAGE } from '@/lib/playIntegrity';

/**
 * Stand-ins for Apple's App Attest and Google's Play Integrity in tests: a root, an intermediate and credential
 * certificates made as Apple makes them, with keys of the test's own, and tokens encrypted and signed as Play's.
 */

const length = (count: number) => count < 128 ? [count] : count < 256 ? [0x81, count] : [0x82, count >> 8, count & 255];
export const der = (tag: number, ...parts: Uint8Array[]) => {
  const body = concat(...parts);
  return concat(new Uint8Array([tag, ...length(body.length)]), body);
};
const sequence = (...parts: Uint8Array[]) => der(0x30, ...parts);
export function oid(dotted: string) {
  const [first, second, ...rest] = dotted.split('.').map(Number);
  const out = [40 * first + second];
  for (const arc of rest) {
    const bytes = [arc & 0x7f];
    for (let value = Math.floor(arc / 128); value > 0; value = Math.floor(value / 128)) bytes.unshift((value & 0x7f) | 0x80);
    out.push(...bytes);
  }
  return der(0x06, new Uint8Array(out));
}
const integer = (bytes: Uint8Array) => {
  let value = bytes;
  while (value.length > 1 && value[0] === 0 && !(value[1] & 0x80)) value = value.subarray(1);
  return der(0x02, value[0] & 0x80 ? concat(new Uint8Array([0]), value) : value);
};
const utcTime = (at: number) => der(0x17, utf8(`${new Date(at).toISOString().slice(2, 19).replace(/[-T:]/g, '')}Z`));
const name = (common: string) => sequence(der(0x31, sequence(oid('2.5.4.3'), der(0x0c, utf8(common)))));

/** WebCrypto's ECDSA signature (r, s) as DER. */
export function derSignature(raw: Uint8Array) {
  const half = raw.length / 2;
  return sequence(integer(raw.subarray(0, half)), integer(raw.subarray(half)));
}

const exported = async (format: 'spki' | 'raw', key: CryptoKey) => new Uint8Array(await crypto.subtle.exportKey(format, key));
const ecdsa = (namedCurve: 'P-256' | 'P-384') =>
  crypto.subtle.generateKey({ name: 'ECDSA', namedCurve }, true, ['sign', 'verify']) as Promise<CryptoKeyPair>;

interface CertificateInput {
  subject: CryptoKey;
  issuer: CryptoKey;
  hash: 'SHA-256' | 'SHA-384';
  notBefore: number;
  notAfter: number;
  extensions?: [string, Uint8Array][];
}

export async function certificate({ subject, issuer, hash, notBefore, notAfter, extensions }: CertificateInput) {
  const algorithm = sequence(oid(hash === 'SHA-256' ? '1.2.840.10045.4.3.2' : '1.2.840.10045.4.3.3'));
  const signed = sequence(der(0xa0, integer(new Uint8Array([2]))), integer(new Uint8Array([7])), algorithm, name('issuer'),
    sequence(utcTime(notBefore), utcTime(notAfter)), name('subject'), await exported('spki', subject),
    ...(extensions ? [der(0xa3, sequence(...extensions.map(([id, value]) => sequence(oid(id), der(0x04, value)))))] : []));
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash }, issuer, signed));
  return sequence(signed, algorithm, der(0x03, new Uint8Array([0]), derSignature(signature)));
}

type Cbor = number | string | Uint8Array | Cbor[] | { [key: string]: Cbor };

export function cbor(value: Cbor): Bytes {
  const head = (major: number, count: number) => count < 24 ? new Uint8Array([(major << 5) | count])
    : count < 256 ? new Uint8Array([(major << 5) | 24, count])
      : new Uint8Array([(major << 5) | 25, count >> 8, count & 255]);
  if (typeof value === 'number') return head(0, value);
  if (typeof value === 'string') return concat(head(3, utf8(value).length), utf8(value));
  if (value instanceof Uint8Array) return concat(head(2, value.length), value);
  if (Array.isArray(value)) return concat(head(4, value.length), ...value.map(cbor));
  const entries = Object.entries(value);
  return concat(head(5, entries.length), ...entries.flatMap(([key, item]) => [cbor(key), cbor(item)]));
}

export const standardBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

const DAY = 86_400_000;

interface AttestOptions {
  appId?: string;
  counter?: number;
  environment?: string;
  /** The key the authenticator data names, if not the certificate's. */
  credentialId?: Uint8Array;
  /** What the certificate's nonce is the hash of, if not the challenge. */
  signedChallenge?: string;
}

/** An Apple of the test's own: its root's key, and a device's attested key making attestations and assertions. */
export async function appAttestKit(now = Date.now()) {
  const [root, intermediate, credential] = await Promise.all([ecdsa('P-384'), ecdsa('P-384'), ecdsa('P-256')]);
  const rootKey = standardBase64(await exported('spki', root.publicKey));
  const intermediateCertificate = await certificate({ subject: intermediate.publicKey, issuer: root.privateKey, hash: 'SHA-384',
    notBefore: now - 365 * DAY, notAfter: now + 365 * DAY });
  const point = await exported('raw', credential.publicKey);
  const keyHash = await sha256(point);
  const keyId = standardBase64(keyHash);

  async function attest(challenge: string, { appId = SCOOTRADAR_APP_ID, counter = 0, environment = 'appattestdevelop',
    credentialId = keyHash, signedChallenge = challenge }: AttestOptions = {}, notAfter = now + 3 * DAY) {
    const counted = new Uint8Array(4);
    new DataView(counted.buffer).setUint32(0, counter);
    const authData = concat(await sha256(utf8(appId)), new Uint8Array([0x40]), counted, utf8(environment.padEnd(16, '\0')),
      new Uint8Array([0, credentialId.length]), credentialId);
    const nonce = await sha256(concat(authData, await sha256(utf8(signedChallenge))));
    const credentialCertificate = await certificate({ subject: credential.publicKey, issuer: intermediate.privateKey, hash: 'SHA-256',
      notBefore: now - DAY, notAfter, extensions: [['1.2.840.113635.100.8.2', sequence(der(0xa1, der(0x04, nonce)))]] });
    return standardBase64(cbor({ fmt: 'apple-appattest', attStmt: { x5c: [credentialCertificate, intermediateCertificate],
      receipt: new Uint8Array([1, 2, 3]) }, authData }));
  }

  async function assert(challenge: string, { appId = SCOOTRADAR_APP_ID, counter = 1 }: { appId?: string; counter?: number } = {}) {
    const counted = new Uint8Array(4);
    new DataView(counted.buffer).setUint32(0, counter);
    const authenticatorData = concat(await sha256(utf8(appId)), new Uint8Array([0x40]), counted);
    const nonce = await sha256(concat(authenticatorData, await sha256(utf8(challenge))));
    const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, credential.privateKey, nonce));
    return standardBase64(cbor({ signature: derSignature(signature), authenticatorData }));
  }

  return { rootKey, point, keyId, attest, assert };
}

/** A Google Play of the test's own: Play Console's two keys, and tokens of verdicts encrypted and signed with them. */
export async function playIntegrityKit() {
  const decryption = crypto.getRandomValues(new Uint8Array(32));
  const verification = await ecdsa('P-256');
  const keys = { decryptionKey: standardBase64(decryption), verificationKey: standardBase64(await exported('spki', verification.publicKey)) };
  const json = (value: unknown) => base64url(utf8(JSON.stringify(value)));

  async function token(verdict: unknown, { signer = verification.privateKey, header = { alg: 'A256KW', enc: 'A256GCM' } } = {}) {
    const signed = `${json({ alg: 'ES256' })}.${json(verdict)}`;
    const jws = `${signed}.${base64url(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signer, utf8(signed)))}`;
    const protectedHeader = json(header);
    const contentKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
    const wrapping = await crypto.subtle.importKey('raw', decryption, 'AES-KW', false, ['wrapKey']);
    const wrapped = await crypto.subtle.wrapKey('raw', contentKey, wrapping, 'AES-KW');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(protectedHeader) }, contentKey, utf8(jws)));
    return [protectedHeader, base64url(wrapped), base64url(iv), base64url(sealed.subarray(0, -16)), base64url(sealed.subarray(-16))].join('.');
  }

  /** A verdict of our app from Google Play, on a device that passes, for the nonce. */
  const verdict = (nonce: string, now = Date.now()) => ({
    requestDetails: { requestPackageName: SCOOTRADAR_PACKAGE, nonce, timestampMillis: String(now) },
    appIntegrity: { appRecognitionVerdict: 'PLAY_RECOGNIZED', packageName: SCOOTRADAR_PACKAGE, certificateSha256Digest: ['abc'], versionCode: '42' },
    deviceIntegrity: { deviceRecognitionVerdict: ['MEETS_BASIC_INTEGRITY', 'MEETS_DEVICE_INTEGRITY'] },
    accountDetails: { appLicensingVerdict: 'LICENSED' },
  });

  return { keys, token, verdict, otherSigner: (await ecdsa('P-256')).privateKey };
}
