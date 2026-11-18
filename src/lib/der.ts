/**
 * Just enough DER to check the certificates of an App Attest attestation (appAttest.ts) with WebCrypto, which reads
 * keys but not certificates: their signed part, signature, key, validity and extensions. Anything it does not
 * expect throws, and the attestation is refused.
 */
import type { Bytes } from '@/lib/bytes';

export interface DerNode {
  tag: number;
  /** Where the node starts, its tag. */
  offset: number;
  /** Where its content starts and ends. */
  start: number;
  end: number;
}

export const SEQUENCE = 0x30;
const INTEGER = 0x02;
const BIT_STRING = 0x03;
const OCTET_STRING = 0x04;
const OBJECT_IDENTIFIER = 0x06;
const UTC_TIME = 0x17;
const GENERALIZED_TIME = 0x18;

export function readDer(bytes: Bytes, offset = 0): DerNode {
  if (offset + 2 > bytes.length) throw new Error('DER: truncated');
  const tag = bytes[offset];
  // Tag numbers above 30 take more bytes; no certificate field this reads has one.
  if ((tag & 0x1f) === 0x1f) throw new Error('DER: long tag');
  let length = bytes[offset + 1];
  let start = offset + 2;
  if (length & 0x80) {
    const count = length & 0x7f;
    if (count === 0 || count > 3 || start + count > bytes.length) throw new Error('DER: length');
    length = 0;
    for (let i = 0; i < count; i++) length = length * 256 + bytes[start + i];
    start += count;
  }
  const end = start + length;
  if (end > bytes.length) throw new Error('DER: truncated');
  return { tag, offset, start, end };
}

export function derChildren(bytes: Bytes, node: DerNode): DerNode[] {
  const children: DerNode[] = [];
  for (let at = node.start; at < node.end;) {
    const child = readDer(bytes, at);
    if (child.end > node.end) throw new Error('DER: child overruns');
    children.push(child);
    at = child.end;
  }
  return children;
}

function expect(node: DerNode | undefined, tag: number): DerNode {
  if (!node || node.tag !== tag) throw new Error(`DER: expected tag ${tag}`);
  return node;
}

const content = (bytes: Bytes, node: DerNode) => bytes.subarray(node.start, node.end);

export function readOid(bytes: Bytes, node: DerNode): string {
  const value = content(bytes, expect(node, OBJECT_IDENTIFIER));
  if (!value.length || value.at(-1)! & 0x80) throw new Error('DER: OID');
  const parts: number[] = [];
  let part = 0;
  for (const byte of value) {
    part = part * 128 + (byte & 0x7f);
    if (!(byte & 0x80)) {
      parts.push(part);
      part = 0;
    }
  }
  // The first number holds the first two arcs.
  const first = Math.min(2, Math.floor(parts[0] / 40));
  return [first, parts[0] - 40 * first, ...parts.slice(1)].join('.');
}

function readTime(bytes: Bytes, node: DerNode): number {
  const text = new TextDecoder().decode(content(bytes, node));
  const match = node.tag === UTC_TIME ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text)
    : node.tag === GENERALIZED_TIME ? /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text) : null;
  if (!match) throw new Error('DER: time');
  const year = node.tag === UTC_TIME ? (Number(match[1]) < 50 ? 2000 : 1900) + Number(match[1]) : Number(match[1]);
  return Date.UTC(year, Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
}

export const P256 = '1.2.840.10045.3.1.7';
export const P384 = '1.3.132.0.34';
const EC_PUBLIC_KEY = '1.2.840.10045.2.1';
const CURVES: Record<string, { name: 'P-256' | 'P-384'; size: number }> = { [P256]: { name: 'P-256', size: 32 }, [P384]: { name: 'P-384', size: 48 } };
const HASHES: Record<string, 'SHA-256' | 'SHA-384'> = { '1.2.840.10045.4.3.2': 'SHA-256', '1.2.840.10045.4.3.3': 'SHA-384' };

export interface Certificate {
  /** The signed part, tbsCertificate, as it was signed. */
  signed: Bytes;
  /** The hash of the issuer's ECDSA signature. */
  hash: 'SHA-256' | 'SHA-384';
  /** The signature, DER-encoded (r and s). */
  signature: Bytes;
  /** The subject's key, as SubjectPublicKeyInfo, its curve, and its point (0x04, x, y). */
  publicKey: Bytes;
  curve: 'P-256' | 'P-384';
  point: Bytes;
  notBefore: number;
  notAfter: number;
  /** Each extension's value, the content of its OCTET STRING, by OID. */
  extensions: Map<string, Bytes>;
}

/** A certificate of ECDSA keys on P-256 or P-384, signed with ECDSA and SHA-256 or SHA-384. */
export function parseCertificate(bytes: Bytes): Certificate {
  const outer = expect(readDer(bytes), SEQUENCE);
  if (outer.end !== bytes.length) throw new Error('DER: trailing bytes');
  const [tbs, algorithm, signatureValue] = derChildren(bytes, outer);
  const hash = HASHES[readOid(bytes, derChildren(bytes, expect(algorithm, SEQUENCE))[0])];
  if (!hash) throw new Error('DER: signature algorithm');
  const bits = content(bytes, expect(signatureValue, BIT_STRING));
  if (bits[0] !== 0) throw new Error('DER: signature bits');
  const fields = derChildren(bytes, expect(tbs, SEQUENCE));
  // [0] version, then serial number, signature, issuer, validity, subject, key, and [3] extensions.
  const at = fields[0]?.tag === 0xa0 ? 1 : 0;
  expect(fields[at], INTEGER);
  const [notBefore, notAfter] = derChildren(bytes, expect(fields[at + 3], SEQUENCE));
  const keyInfo = expect(fields[at + 5], SEQUENCE);
  const [keyAlgorithm, keyBits] = derChildren(bytes, keyInfo);
  const [keyType, curveOid] = derChildren(bytes, expect(keyAlgorithm, SEQUENCE));
  const curve = CURVES[readOid(bytes, curveOid)];
  if (readOid(bytes, keyType) !== EC_PUBLIC_KEY || !curve) throw new Error('DER: key type');
  const point = content(bytes, expect(keyBits, BIT_STRING)).subarray(1);
  if (point.length !== 1 + 2 * curve.size || point[0] !== 4) throw new Error('DER: key point');
  const extensions = new Map<string, Bytes>();
  const tagged = fields.slice(at + 6).find(field => field.tag === 0xa3);
  if (tagged) {
    for (const extension of derChildren(bytes, expect(derChildren(bytes, tagged)[0], SEQUENCE))) {
      const parts = derChildren(bytes, expect(extension, SEQUENCE));
      extensions.set(readOid(bytes, parts[0]), content(bytes, expect(parts.at(-1), OCTET_STRING)));
    }
  }
  return { signed: bytes.subarray(tbs.offset, tbs.end), hash, signature: bits.subarray(1),
    publicKey: bytes.subarray(keyInfo.offset, keyInfo.end), curve: curve.name, point,
    notBefore: readTime(bytes, notBefore), notAfter: readTime(bytes, notAfter), extensions };
}

/** An ECDSA signature as DER (a SEQUENCE of r and s) to WebCrypto's: r and s, each `size` bytes. */
export function rawSignature(der: Bytes, size: number): Bytes {
  const sequence = expect(readDer(der), SEQUENCE);
  if (sequence.end !== der.length) throw new Error('DER: trailing bytes');
  const raw = new Uint8Array(2 * size);
  derChildren(der, sequence).forEach((node, index) => {
    if (index > 1) throw new Error('DER: signature');
    let value = content(der, expect(node, INTEGER));
    while (value.length > 1 && value[0] === 0) value = value.subarray(1);
    if (value.length > size) throw new Error('DER: signature');
    raw.set(value, (index + 1) * size - value.length);
  });
  return raw;
}

/** The OCTET STRINGs anywhere in a DER value, as App Attest's nonce extension holds its nonce in one. */
export function octetStrings(bytes: Bytes, node: DerNode = readDer(bytes)): Bytes[] {
  if (node.tag === OCTET_STRING) return [content(bytes, node)];
  // Constructed: a SEQUENCE, a SET or a context tag holding others.
  if (!(node.tag & 0x20)) return [];
  return derChildren(bytes, node).flatMap(child => octetStrings(bytes, child));
}

/** Whether the certificate was signed by the key (SubjectPublicKeyInfo) on the curve. */
export async function signedBy(certificate: Certificate, issuerKey: Bytes, curve: 'P-256' | 'P-384'): Promise<boolean> {
  const key = await crypto.subtle.importKey('spki', issuerKey, { name: 'ECDSA', namedCurve: curve }, false, ['verify']);
  return crypto.subtle.verify({ name: 'ECDSA', hash: certificate.hash }, key,
    rawSignature(certificate.signature, curve === 'P-256' ? 32 : 48), certificate.signed);
}
