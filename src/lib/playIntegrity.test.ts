import { describe, expect, it } from 'vitest';
import { playIntegrityKit } from '@/test/attestationKit';
import { verifyIntegrityToken } from './playIntegrity';

const nonce = 'A'.repeat(64);
const now = Date.UTC(2026, 10, 18, 22, 0);

describe('Play Integrity', () => {
  it('passes a verdict of our app from Google Play on a device that passes, for the challenge, decrypted and checked here', async () => {
    const play = await playIntegrityKit();
    const token = await play.token(play.verdict(nonce, now - 2000));
    expect(await verifyIntegrityToken({ token, ...play.keys, nonce, now })).toEqual({ ok: true });
  });

  it('refuses a verdict for another challenge, app or copy, an old one, a device that fails, and one Play did not sign', async () => {
    const play = await playIntegrityKit();
    const check = async (change: (verdict: ReturnType<typeof play.verdict>) => void, options = {}) => {
      const verdict = play.verdict(nonce, now);
      change(verdict);
      return verifyIntegrityToken({ token: await play.token(verdict, options), ...play.keys, nonce, now });
    };
    expect(await check(verdict => { verdict.requestDetails.nonce = 'B'.repeat(64); })).toEqual({ ok: false, reason: 'request' });
    expect(await check(verdict => { verdict.requestDetails.requestPackageName = 'com.example.other'; })).toEqual({ ok: false, reason: 'request' });
    expect(await check(verdict => { verdict.requestDetails.timestampMillis = String(now - 6 * 60_000); })).toEqual({ ok: false, reason: 'stale' });
    expect(await check(verdict => { verdict.appIntegrity.appRecognitionVerdict = 'UNRECOGNIZED_VERSION'; })).toEqual({ ok: false, reason: 'app' });
    expect(await check(verdict => { verdict.deviceIntegrity.deviceRecognitionVerdict = ['MEETS_BASIC_INTEGRITY']; }))
      .toEqual({ ok: false, reason: 'device' });
    expect(await check(verdict => { verdict.deviceIntegrity = {} as typeof verdict.deviceIntegrity; })).toEqual({ ok: false, reason: 'device' });
    expect(await check(() => {}, { signer: play.otherSigner })).toEqual({ ok: false, reason: 'signature' });
    expect(await check(() => {}, { header: { alg: 'RSA-OAEP', enc: 'A256GCM' } })).toEqual({ ok: false, reason: 'format' });
  });

  it('refuses a token it cannot decrypt', async () => {
    const play = await playIntegrityKit();
    const other = await playIntegrityKit();
    const token = await play.token(play.verdict(nonce, now));
    expect(await verifyIntegrityToken({ token, ...other.keys, nonce, now })).toEqual({ ok: false, reason: 'decrypt' });
    const parts = token.split('.');
    parts[3] = parts[3].replace(/^./, character => character === 'A' ? 'B' : 'A');
    expect(await verifyIntegrityToken({ token: parts.join('.'), ...play.keys, nonce, now })).toEqual({ ok: false, reason: 'decrypt' });
    expect(await verifyIntegrityToken({ token: 'a.b.c', ...play.keys, nonce, now })).toEqual({ ok: false, reason: 'format' });
  });
});
