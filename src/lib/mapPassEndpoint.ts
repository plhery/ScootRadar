import { checkAppPass, issuePassChallenge, type AppPassCheck, type AppPassRequest } from '@/lib/appPass';
import { clientNetwork } from '@/lib/clientNetwork';
import { API_CONTENT_SECURITY_POLICY } from '@/lib/contentSecurityPolicy';
import { issueMapPass, MAP_PASS_ACTION, mapPassCookie } from '@/lib/mapPass';
import { SITE_URL } from '@/lib/site';

export { MAP_PASS_PATH } from '@/lib/mapPass';
export { PASS_CHALLENGE_PATH } from '@/lib/appPass';
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface MapPassEnvironment {
  /** The secret of the Turnstile widget the web map renders (DEPLOY.md). */
  TURNSTILE_SECRET_KEY?: string;
  /** The key the passes are signed with (mapPass.ts). */
  MAP_PASS_SECRET?: string;
  /** Play Console's keys for Play Integrity's verdicts (appPass.ts). */
  PLAY_INTEGRITY_DECRYPTION_KEY?: string;
  PLAY_INTEGRITY_VERIFICATION_KEY?: string;
  SCOOTER_API_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

interface Siteverify {
  success?: boolean;
  hostname?: string;
  action?: string;
  'error-codes'?: string[];
}

const HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': API_CONTENT_SECURITY_POLICY };

const answer = (status: number, error: string, headers: Record<string, string> = {}) =>
  Response.json({ error }, { status, headers: { ...HEADERS, ...headers } });

/** The visitor's address and network, once the rate limit lets the request through; a 429 otherwise. */
async function admitted(request: Request, env: MapPassEnvironment) {
  const address = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const network = clientNetwork(address);
  if (!(await env.SCOOTER_API_RATE_LIMITER.limit({ key: network })).success) {
    return answer(429, 'Too many requests. Please try again shortly.', { 'Retry-After': '60' });
  }
  return { address, network };
}

/**
 * GET /api/pass/challenge: what an app signs to ask for a pass (appPass.ts). The Android app names itself
 * (`?platform=android`), so that it spends none of Play Integrity's daily requests while the Worker has no keys
 * to read its verdicts.
 */
export async function answerPassChallenge(request: Request, env: MapPassEnvironment): Promise<Response> {
  if (request.method !== 'GET') return answer(405, 'Method not allowed.', { Allow: 'GET' });
  const visitor = await admitted(request, env);
  if (visitor instanceof Response) return visitor;
  const android = new URL(request.url).searchParams.get('platform') === 'android';
  if (!env.MAP_PASS_SECRET || (android && !(env.PLAY_INTEGRITY_DECRYPTION_KEY && env.PLAY_INTEGRITY_VERIFICATION_KEY))) {
    return answer(503, 'Map passes are not available.');
  }
  return Response.json({ challenge: await issuePassChallenge(env.MAP_PASS_SECRET, visitor.network) }, { headers: HEADERS });
}

/**
 * POST /api/pass. The web map's, with the token of its Turnstile widget: once Cloudflare has checked it, for this
 * site and the map's action, the Worker sets the map pass as a cookie (mapPass.ts). An app's, with its proof of
 * App Attest or Play Integrity over a challenge (appPass.ts): the pass, and its expiry, in the answer. Counted
 * against the visitor's limit for scooters, as each pass is asked for after an answer of them.
 */
export async function answerMapPass(request: Request, env: MapPassEnvironment): Promise<Response> {
  if (request.method !== 'POST') return answer(405, 'Method not allowed.', { Allow: 'POST' });
  const visitor = await admitted(request, env);
  if (visitor instanceof Response) return visitor;
  const { address, network } = visitor;
  if (!env.MAP_PASS_SECRET) return answer(503, 'Map passes are not available.');
  let body: { token?: unknown; platform?: unknown } | null;
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = null;
  }
  if (body?.platform === 'ios' || body?.platform === 'android') {
    return answerAppPass(body as AppPassRequest, { ...env, MAP_PASS_SECRET: env.MAP_PASS_SECRET }, network);
  }
  if (!env.TURNSTILE_SECRET_KEY) return answer(503, 'Map passes are not available.');
  const token = body?.token;
  // Turnstile's tokens are at most 2048 characters.
  if (typeof token !== 'string' || !token || token.length > 2048) return answer(400, 'A Turnstile token is required.');
  let verdict: Siteverify;
  try {
    const response = await fetch(SITEVERIFY, { method: 'POST', signal: AbortSignal.timeout(5000),
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: address }) });
    verdict = await response.json() as Siteverify;
  } catch (error) {
    console.error(JSON.stringify({ event: 'map_pass_unverified', error: error instanceof Error ? error.name : 'UnknownError' }));
    return answer(503, 'The check could not be made. Please try again later.');
  }
  if (verdict.success !== true || verdict.hostname !== new URL(SITE_URL).hostname || verdict.action !== MAP_PASS_ACTION) {
    console.warn(JSON.stringify({ event: 'map_pass_refused', errors: verdict['error-codes'] ?? [],
      ...(verdict.success === true && { hostname: verdict.hostname, action: verdict.action }) }));
    return answer(403, 'The check did not pass.');
  }
  return new Response(null, { status: 204, headers: { ...HEADERS,
    'Set-Cookie': mapPassCookie(await issueMapPass(env.MAP_PASS_SECRET, network)) } });
}

/** An app's ask: its pass, and the iPhone's key signed after its attestation; refusals logged with their reason only. */
async function answerAppPass(body: AppPassRequest, env: MapPassEnvironment & { MAP_PASS_SECRET: string }, network: string) {
  const now = Date.now();
  let check: AppPassCheck;
  try {
    check = await checkAppPass(body, env, network, now);
  } catch (error) {
    console.error(JSON.stringify({ event: 'app_pass_unverified', platform: body.platform, error: error instanceof Error ? error.name : 'UnknownError' }));
    return answer(503, 'The check could not be made. Please try again later.');
  }
  if (check.status !== 'passed') {
    if (check.status === 'malformed') return answer(400, 'A challenge and a proof are required.');
    if (check.status === 'unavailable') return answer(503, 'Map passes are not available.');
    console.warn(JSON.stringify({ event: 'app_pass_refused', platform: body.platform, reason: check.reason }));
    return answer(403, 'The check did not pass.');
  }
  const pass = await issueMapPass(env.MAP_PASS_SECRET, network, now);
  return Response.json({ pass, expiresAt: Number(pass.split('.')[0]), ...(check.key && { key: check.key }) }, { headers: HEADERS });
}
