/**
 * Just enough CBOR to read App Attest's attestation and assertion objects (appAttest.ts): definite lengths, maps
 * with text keys, byte and text strings, arrays, integers and simple values. Anything else throws, and the object
 * is refused.
 */
import type { Bytes } from '@/lib/bytes';

export type CborValue = number | string | boolean | null | undefined | Bytes | CborValue[] | Map<string, CborValue>;

const MAX_DEPTH = 8;

export function decodeCbor(bytes: Bytes): CborValue {
  let at = 0;
  const take = (count: number) => {
    if (at + count > bytes.length) throw new Error('CBOR: truncated');
    const taken = bytes.subarray(at, at + count);
    at += count;
    return taken;
  };
  const argument = (info: number) => {
    if (info < 24) return info;
    if (info > 27) throw new Error('CBOR: indefinite or reserved length');
    let value = 0;
    for (const byte of take(2 ** (info - 24))) value = value * 256 + byte;
    if (!Number.isSafeInteger(value)) throw new Error('CBOR: too large');
    return value;
  };
  const item = (depth: number): CborValue => {
    if (depth > MAX_DEPTH) throw new Error('CBOR: too deep');
    const [initial] = take(1);
    const major = initial >> 5;
    const info = initial & 0x1f;
    if (major === 7) {
      switch (info) {
        case 20: return false;
        case 21: return true;
        case 22: return null;
        case 23: return undefined;
        default: throw new Error('CBOR: unsupported simple value');
      }
    }
    const value = argument(info);
    switch (major) {
      case 0: return value;
      case 1: return -1 - value;
      case 2: return take(value).slice();
      case 3: return new TextDecoder('utf-8', { fatal: true }).decode(take(value));
      case 4: {
        // Each item takes a byte at least.
        if (value > bytes.length - at) throw new Error('CBOR: truncated');
        return Array.from({ length: value }, () => item(depth + 1));
      }
      case 5: {
        if (2 * value > bytes.length - at) throw new Error('CBOR: truncated');
        const map = new Map<string, CborValue>();
        for (let i = 0; i < value; i++) {
          const key = item(depth + 1);
          if (typeof key !== 'string') throw new Error('CBOR: key is not text');
          map.set(key, item(depth + 1));
        }
        return map;
      }
      // A tag: the value it marks.
      default: return item(depth + 1);
    }
  };
  const value = item(0);
  if (at !== bytes.length) throw new Error('CBOR: trailing bytes');
  return value;
}
