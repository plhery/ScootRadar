import { APPLE_APP_ATTESTATION_ROOT, verifyAssertion, verifyAttestation } from '@/lib/appAttest';
import { base64url, concat, fromBase64, hmac, sameBytes, sha256, utf8, type Bytes } from '@/lib/bytes';
import { verifyIntegrityToken } from '@/lib/playIntegrity';

/**
 * The apps' way to the map pass (mapPass.ts): the iPhone app proves it is ours with App Attest (appAttest.ts), the
 * Android app from Google Play with Play Integrity (playIntegrity.ts), each over a challenge of the Worker's. The
 * Worker keeps nothing: the challenge carries its time and a signature of it and of the network it was given to,
 * and the iPhone's key comes back with the app, signed when it was attested. The pass is then sent in the
 * X-Scooter-Pass header, as an app holds no cookie.
 */

/** Where an app asks for a challenge, before it asks POST /api/pass. */
export const PASS_CHALLENGE_PATH = '/api/pass/challenge';
/** How long a challenge may be answered, from the network it was given to. */
export const PASS_CHALLENGE_SECONDS = 5 * 60;

const CHALLENGE = /^[A-Za-z0-9_-]{64}$/;

const challengeSignature = async (secret: string, network: string, head: Bytes) =>
  hmac(secret, `scootradar-pass-challenge:1:${network}:${base64url(head)}`);

/**
 * 48 bytes in URL-safe base64, as Play Integrity takes a nonce: the second it was given (4), 12 random bytes, and
 * the signature (32). No padding, as 48 bytes need none.
 */
export async function issuePassChallenge(secret: string, network: string, now = Date.now()): Promise<string> {
  const head = new Uint8Array(16);
  new DataView(head.buffer).setUint32(0, Math.floor(now / 1000));
  crypto.getRandomValues(head.subarray(4));
  return base64url(concat(head, await challengeSignature(secret, network, head)));
}

export async function checkPassChallenge(challenge: string, secret: string, network: string, now = Date.now()): Promise<boolean> {
  if (!CHALLENGE.test(challenge)) return false;
  const bytes = fromBase64(challenge);
  const head = bytes.subarray(0, 16);
  const age = now / 1000 - new DataView(bytes.buffer).getUint32(0);
  // A minute ahead at most, as clocks of data centres differ.
  if (age > PASS_CHALLENGE_SECONDS || age < -60) return false;
  return sameBytes(bytes.subarray(16), await challengeSignature(secret, network, head));
}

const keySignature = async (secret: string, keyId: string, point: string) => base64url(await hmac(secret, `scootradar-app-key:1:${keyId}:${point}`));

/** The iPhone app's key, once attested, signed for the app to show with its assertions: its point and a signature. */
export async function signAppKey(secret: string, keyId: string, publicKey: Bytes): Promise<string> {
  const point = base64url(publicKey);
  return `${point}.${await keySignature(secret, keyId, point)}`;
}

/** The key a signed one holds, if the Worker signed it for this identifier. */
export async function readAppKey(signed: string, secret: string, keyId: string): Promise<Bytes | null> {
  const match = /^([A-Za-z0-9_-]{87})\.([A-Za-z0-9_-]{43})$/.exec(signed);
  if (!match || !sameBytes(utf8(match[2]), utf8(await keySignature(secret, keyId, match[1])))) return null;
  const point = fromBase64(match[1]);
  // The identifier is the hash of the key, as App Attest makes it.
  return sameBytes(await sha256(point), fromBase64(keyId)) ? point : null;
}

export interface AppPassEnvironment {
  MAP_PASS_SECRET: string;
  /** Play Console's keys for Play Integrity's verdicts (DEPLOY.md, "Map passes"). */
  PLAY_INTEGRITY_DECRYPTION_KEY?: string;
  PLAY_INTEGRITY_VERIFICATION_KEY?: string;
}

/** What an app sends to POST /api/pass. */
export interface AppPassRequest {
  platform: 'ios' | 'android';
  challenge: string;
  /** iOS: the key's identifier, and its attestation the first time, or its signed key and an assertion. */
  keyId?: string;
  attestation?: string;
  key?: string;
  assertion?: string;
  /** Android: Play Integrity's token. */
  integrityToken?: string;
}

export type AppPassCheck = { status: 'passed'; key?: string } | { status: 'refused' | 'malformed' | 'unavailable'; reason: string };

const KEY_ID = /^[A-Za-z0-9+/]{43}=$/;
// An attestation is some 5,500 bytes, an assertion and a Play Integrity token some hundreds to two thousand.
const MAX_PROOF = 16_384;
const isProof = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= MAX_PROOF;

/** Whether the app's proof holds, for the challenge given to this network. */
export async function checkAppPass(body: AppPassRequest, env: AppPassEnvironment, network: string, now = Date.now(),
  appleRoot = APPLE_APP_ATTESTATION_ROOT): Promise<AppPassCheck> {
  if (typeof body.challenge !== 'string' || !CHALLENGE.test(body.challenge)) return { status: 'malformed', reason: 'challenge' };
  if (body.platform === 'android') {
    if (!isProof(body.integrityToken)) return { status: 'malformed', reason: 'token' };
    if (!env.PLAY_INTEGRITY_DECRYPTION_KEY || !env.PLAY_INTEGRITY_VERIFICATION_KEY) return { status: 'unavailable', reason: 'keys' };
  } else if (typeof body.keyId !== 'string' || !KEY_ID.test(body.keyId)
    || !(isProof(body.attestation) || (isProof(body.assertion) && typeof body.key === 'string'))) {
    return { status: 'malformed', reason: 'proof' };
  }
  if (!(await checkPassChallenge(body.challenge, env.MAP_PASS_SECRET, network, now))) return { status: 'refused', reason: 'challenge' };
  const clientData = utf8(body.challenge);
  if (body.platform === 'android') {
    const verdict = await verifyIntegrityToken({ token: body.integrityToken!, decryptionKey: env.PLAY_INTEGRITY_DECRYPTION_KEY!,
      verificationKey: env.PLAY_INTEGRITY_VERIFICATION_KEY!, nonce: body.challenge, now });
    return verdict.ok ? { status: 'passed' } : { status: 'refused', reason: verdict.reason };
  }
  let proof: Bytes;
  try {
    proof = fromBase64((body.attestation ?? body.assertion)!);
  } catch {
    return { status: 'malformed', reason: 'proof' };
  }
  const keyId = body.keyId!;
  if (body.attestation) {
    const attested = await verifyAttestation({ attestation: proof, keyId, clientData, now, root: appleRoot });
    if (!attested.ok) return { status: 'refused', reason: attested.reason };
    return { status: 'passed', key: await signAppKey(env.MAP_PASS_SECRET, keyId, attested.publicKey) };
  }
  const publicKey = await readAppKey(body.key!, env.MAP_PASS_SECRET, keyId);
  if (!publicKey) return { status: 'refused', reason: 'key' };
  const asserted = await verifyAssertion({ assertion: proof, publicKey, clientData });
  return asserted.ok ? { status: 'passed' } : { status: 'refused', reason: asserted.reason };
}
