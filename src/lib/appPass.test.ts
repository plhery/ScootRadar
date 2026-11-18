import { describe, expect, it } from 'vitest';
import { appAttestKit, playIntegrityKit } from '@/test/attestationKit';
import { checkAppPass, checkPassChallenge, issuePassChallenge, PASS_CHALLENGE_SECONDS, readAppKey, signAppKey } from './appPass';
import { fromBase64 } from './bytes';

const secret = 'a-test-secret-of-the-worker-that-signs-map-passes';
const network = '2001:db8:1:2::';
const now = Date.UTC(2026, 10, 18, 22, 0);

describe('pass challenge', () => {
  it('is 48 bytes in URL-safe base64, as Play Integrity takes a nonce, answered on its network for five minutes', async () => {
    const challenge = await issuePassChallenge(secret, network, now);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{64}$/);
    expect(fromBase64(challenge)).toHaveLength(48);
    expect(await issuePassChallenge(secret, network, now)).not.toBe(challenge);
    expect(await checkPassChallenge(challenge, secret, network, now + PASS_CHALLENGE_SECONDS * 1000)).toBe(true);
    expect(await checkPassChallenge(challenge, secret, network, now + PASS_CHALLENGE_SECONDS * 1000 + 1000)).toBe(false);
    expect(await checkPassChallenge(challenge, secret, '192.0.2.1', now)).toBe(false);
    expect(await checkPassChallenge(challenge, 'another-secret', network, now)).toBe(false);
    expect(await checkPassChallenge(`${challenge.slice(0, -1)}${challenge.endsWith('A') ? 'B' : 'A'}`, secret, network, now)).toBe(false);
    expect(await checkPassChallenge('A'.repeat(64), secret, network, now)).toBe(false);
  });
});

describe('app pass', () => {
  it('passes the iPhone app attested by Apple, handing it its key signed, then its assertions with that key', async () => {
    const apple = await appAttestKit(now);
    const challenge = await issuePassChallenge(secret, network, now);
    const attested = await checkAppPass({ platform: 'ios', challenge, keyId: apple.keyId, attestation: await apple.attest(challenge) },
      { MAP_PASS_SECRET: secret }, network, now, apple.rootKey);
    expect(attested).toEqual({ status: 'passed', key: expect.stringMatching(/^[\w-]{87}\.[\w-]{43}$/) });
    const key = (attested as { key: string }).key;
    expect(await readAppKey(key, secret, apple.keyId)).toEqual(apple.point);

    const next = await issuePassChallenge(secret, network, now + 60_000);
    const asserted = (assertion: string, signed = key) =>
      checkAppPass({ platform: 'ios', challenge: next, keyId: apple.keyId, key: signed, assertion }, { MAP_PASS_SECRET: secret }, network, now + 60_000);
    expect(await asserted(await apple.assert(next))).toEqual({ status: 'passed' });
    // An assertion of another challenge, and a key the Worker did not sign or signed for another identifier.
    expect(await asserted(await apple.assert(challenge))).toEqual({ status: 'refused', reason: 'signature' });
    const other = await appAttestKit(now);
    expect(await asserted(await other.assert(next), await signAppKey(secret, apple.keyId, other.point))).toEqual({ status: 'refused', reason: 'key' });
    expect(await asserted(await apple.assert(next), await signAppKey('another-secret', apple.keyId, apple.point))).toEqual({ status: 'refused', reason: 'key' });
  });

  it('refuses Apple\'s proof of a challenge given to another network or too long ago', async () => {
    const apple = await appAttestKit(now);
    const challenge = await issuePassChallenge(secret, '192.0.2.1', now);
    expect(await checkAppPass({ platform: 'ios', challenge, keyId: apple.keyId, attestation: await apple.attest(challenge) },
      { MAP_PASS_SECRET: secret }, network, now, apple.rootKey)).toEqual({ status: 'refused', reason: 'challenge' });
    const old = await issuePassChallenge(secret, network, now - 10 * 60_000);
    expect(await checkAppPass({ platform: 'ios', challenge: old, keyId: apple.keyId, attestation: await apple.attest(old) },
      { MAP_PASS_SECRET: secret }, network, now, apple.rootKey)).toEqual({ status: 'refused', reason: 'challenge' });
  });

  it('passes the Android app from Google Play with Play\'s verdict on the challenge, once Play Console\'s keys are set', async () => {
    const play = await playIntegrityKit();
    const challenge = await issuePassChallenge(secret, network, now);
    const env = { MAP_PASS_SECRET: secret, PLAY_INTEGRITY_DECRYPTION_KEY: play.keys.decryptionKey,
      PLAY_INTEGRITY_VERIFICATION_KEY: play.keys.verificationKey };
    const integrityToken = await play.token(play.verdict(challenge, now));
    expect(await checkAppPass({ platform: 'android', challenge, integrityToken }, env, network, now)).toEqual({ status: 'passed' });
    const verdict = play.verdict(challenge, now);
    verdict.deviceIntegrity.deviceRecognitionVerdict = [];
    expect(await checkAppPass({ platform: 'android', challenge, integrityToken: await play.token(verdict) }, env, network, now))
      .toEqual({ status: 'refused', reason: 'device' });
    expect(await checkAppPass({ platform: 'android', challenge, integrityToken }, { MAP_PASS_SECRET: secret }, network, now))
      .toEqual({ status: 'unavailable', reason: 'keys' });
  });

  it('calls malformed an ask without a challenge or a proof', async () => {
    const env = { MAP_PASS_SECRET: secret };
    const challenge = await issuePassChallenge(secret, network, now);
    for (const body of [{ platform: 'ios', challenge: 'short', keyId: 'x', attestation: 'y' },
      { platform: 'ios', challenge, attestation: 'AAAA' },
      { platform: 'ios', challenge, keyId: `${'A'.repeat(43)}=`, assertion: 'AAAA' },
      { platform: 'ios', challenge, keyId: `${'A'.repeat(43)}=`, attestation: 'A'.repeat(20_000) },
      { platform: 'ios', challenge, keyId: `${'A'.repeat(43)}=`, attestation: 'not base64!' },
      { platform: 'android', challenge }]) {
      expect(await checkAppPass(body as Parameters<typeof checkAppPass>[0], env, network, now)).toMatchObject({ status: 'malformed' });
    }
  });
});
