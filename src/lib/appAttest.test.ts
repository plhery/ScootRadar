import { describe, expect, it } from 'vitest';
import { appAttestKit, cbor, standardBase64 } from '@/test/attestationKit';
import { APPLE_APP_ATTESTATION_ROOT, verifyAssertion, verifyAttestation } from './appAttest';
import { fromBase64, utf8 } from './bytes';
import { decodeCbor } from './cbor';
import { parseCertificate, signedBy } from './der';

// Apple's App Attestation Root CA, as https://www.apple.com/certificateauthority/Apple_App_Attestation_Root_CA.pem gives it.
const APPLE_ROOT_CERTIFICATE = `MIICITCCAaegAwIBAgIQC/O+DvHN0uD7jG5yH2IXmDAKBggqhkjOPQQDAzBSMSYw
JAYDVQQDDB1BcHBsZSBBcHAgQXR0ZXN0YXRpb24gUm9vdCBDQTETMBEGA1UECgwK
QXBwbGUgSW5jLjETMBEGA1UECAwKQ2FsaWZvcm5pYTAeFw0yMDAzMTgxODMyNTNa
Fw00NTAzMTUwMDAwMDBaMFIxJjAkBgNVBAMMHUFwcGxlIEFwcCBBdHRlc3RhdGlv
biBSb290IENBMRMwEQYDVQQKDApBcHBsZSBJbmMuMRMwEQYDVQQIDApDYWxpZm9y
bmlhMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAERTHhmLW07ATaFQIEVwTtT4dyctdh
NbJhFs/Ii2FdCgAHGbpphY3+d8qjuDngIN3WVhQUBHAoMeQ/cLiP1sOUtgjqK9au
Yen1mMEvRq9Sk3Jm5X8U62H+xTD3FE9TgS41o0IwQDAPBgNVHRMBAf8EBTADAQH/
MB0GA1UdDgQWBBSskRBTM72+aEH/pwyp5frq5eWKoTAOBgNVHQ8BAf8EBAMCAQYw
CgYIKoZIzj0EAwMDaAAwZQIwQgFGnByvsiVbpTKwSga0kP0e8EeDS4+sQmTvb7vn
53O5+FRXgeLhpJ06ysC5PrOyAjEAp5U4xDgEgllF7En3VcE3iexZZtKeYnpqtijV
oyFraWVIyd/dganmrduC1bmTBGwD`.replaceAll('\n', '');

const challenge = 'A'.repeat(64);
const now = Date.UTC(2026, 10, 18, 22, 0);

describe('certificates and CBOR', () => {
  it('read Apple\'s own root: its key is the one the Worker holds, and it signed itself', async () => {
    const root = parseCertificate(fromBase64(APPLE_ROOT_CERTIFICATE));
    expect(standardBase64(root.publicKey)).toBe(APPLE_APP_ATTESTATION_ROOT);
    expect(root.curve).toBe('P-384');
    expect(root.hash).toBe('SHA-384');
    expect(new Date(root.notAfter).toISOString()).toBe('2045-03-15T00:00:00.000Z');
    expect(await signedBy(root, root.publicKey, 'P-384')).toBe(true);
  });

  it('read CBOR\'s maps, strings, bytes and arrays, and refuse what is cut short or left over', () => {
    const value = decodeCbor(cbor({ fmt: 'apple-appattest', list: [1, 300, new Uint8Array([9])] }));
    expect(value).toEqual(new Map<string, unknown>([['fmt', 'apple-appattest'], ['list', [1, 300, new Uint8Array([9])]]]));
    const bytes = cbor({ a: 'b' });
    expect(() => decodeCbor(bytes.subarray(0, -1))).toThrow();
    expect(() => decodeCbor(new Uint8Array([...bytes, 0]))).toThrow();
    // An indefinite length, and a map of a million entries in three bytes.
    expect(() => decodeCbor(new Uint8Array([0x5f]))).toThrow();
    expect(() => decodeCbor(new Uint8Array([0xba, 0, 15, 66, 64]))).toThrow();
  });
});

describe('App Attest', () => {
  it('passes a key attested by Apple\'s chain for our app and the challenge, in either environment', async () => {
    const apple = await appAttestKit(now);
    for (const environment of ['appattestdevelop', 'appattest']) {
      const attestation = fromBase64(await apple.attest(challenge, { environment }));
      expect(await verifyAttestation({ attestation, keyId: apple.keyId, clientData: utf8(challenge), root: apple.rootKey, now }))
        .toEqual({ ok: true, publicKey: apple.point });
    }
  });

  it('refuses an attestation of another chain, challenge, app, key, environment, or a used key', async () => {
    const apple = await appAttestKit(now);
    const check = async (attestation: string, { keyId = apple.keyId, root = apple.rootKey, at = now } = {}) =>
      verifyAttestation({ attestation: fromBase64(attestation), keyId, clientData: utf8(challenge), root, now: at });
    expect(await check(await apple.attest(challenge), { root: APPLE_APP_ATTESTATION_ROOT })).toEqual({ ok: false, reason: 'chain' });
    expect(await check(await apple.attest(challenge, { signedChallenge: 'B'.repeat(64) }))).toEqual({ ok: false, reason: 'nonce' });
    expect(await check(await apple.attest(challenge, { appId: 'HGC93X794T.com.example.other' }))).toEqual({ ok: false, reason: 'app' });
    expect(await check(await apple.attest(challenge), { keyId: standardBase64(new Uint8Array(32)) })).toEqual({ ok: false, reason: 'key' });
    expect(await check(await apple.attest(challenge, { credentialId: new Uint8Array(32) }))).toEqual({ ok: false, reason: 'key' });
    expect(await check(await apple.attest(challenge, { environment: 'something-else' }))).toEqual({ ok: false, reason: 'environment' });
    expect(await check(await apple.attest(challenge, { counter: 1 }))).toEqual({ ok: false, reason: 'counter' });
    expect(await check(await apple.attest(challenge, {}, now - 1000))).toEqual({ ok: false, reason: 'expired' });
    expect(await check(standardBase64(cbor({ fmt: 'packed' })))).toEqual({ ok: false, reason: 'format' });
    expect(await check(standardBase64(new Uint8Array([1, 2, 3])))).toEqual({ ok: false, reason: 'format' });
  });

  it('passes an assertion the attested key signed for our app and the challenge, and no other', async () => {
    const apple = await appAttestKit(now);
    const check = async (assertion: string, data = challenge) =>
      verifyAssertion({ assertion: fromBase64(assertion), publicKey: apple.point, clientData: utf8(data) });
    expect(await check(await apple.assert(challenge))).toEqual({ ok: true });
    expect(await check(await apple.assert(challenge), 'B'.repeat(64))).toEqual({ ok: false, reason: 'signature' });
    expect(await check(await apple.assert(challenge, { appId: 'HGC93X794T.com.example.other' }))).toEqual({ ok: false, reason: 'app' });
    expect(await check(await apple.assert(challenge, { counter: 0 }))).toEqual({ ok: false, reason: 'counter' });
    const other = await appAttestKit(now);
    expect(await check(await other.assert(challenge))).toEqual({ ok: false, reason: 'signature' });
    expect(await check(standardBase64(cbor({ signature: new Uint8Array(8) })))).toEqual({ ok: false, reason: 'format' });
  });
});
