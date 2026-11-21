import { MAP_PASS_ACTION, MAP_PASS_PATH } from '@/lib/mapPass';
import { SITE } from '@/lib/site';

/**
 * The web map's Turnstile widget (DEPLOY.md, "Map passes"): invisible, for the site's host. Its key is the
 * deployment's TURNSTILE_SITE_KEY, its secret the Worker's TURNSTILE_SECRET_KEY. Without a key the map never
 * asks for a pass, and a Worker given the secret refuses it its scooters.
 */
export const TURNSTILE_SITE_KEY = SITE.TURNSTILE_SITE_KEY;
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** After a try, passed or not, the next waits this long: a pass lasts a day, and a refused browser stays refused. */
export const MAP_PASS_RETRY_MS = 10 * 60_000;
/** How long after the answer that asks for it the check starts: the map, its tiles and scooters, come first. */
export const MAP_PASS_DELAY_MS = 3_000;
/**
 * After a try that failed, or a pass the next answer did not count (as where cookies are refused), how long a map that
 * needs its pass now (mapPassNow) waits before it tries again: meanwhile it says this browser could not be checked.
 */
export const MAP_PASS_URGENT_RETRY_MS = 30_000;
const CHECK_TIMEOUT_MS = 30_000;

interface Turnstile {
  render(container: HTMLElement, options: Record<string, unknown>): string | undefined;
  remove(widget: string): void;
}

declare global {
  interface Window { turnstile?: Turnstile }
}

let loading: Promise<Turnstile> | null = null;
let triedAt = -Infinity;
let failedAt = -Infinity;
let running: Promise<boolean> | null = null;

/** Turnstile's script, loaded once, with the page's nonce, which it gives what it loads (CSP, 'strict-dynamic'). */
function loadTurnstile(): Promise<Turnstile> {
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    if (window.turnstile) { resolve(window.turnstile); return; }
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.nonce = document.querySelector<HTMLScriptElement>('script[nonce]')?.nonce ?? '';
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not load'));
    script.onerror = () => reject(new Error('Turnstile did not load'));
    document.head.appendChild(script);
  }).catch(error => {
    loading = null;
    throw error;
  });
  return loading;
}

/** A token of the invisible widget, which shows nothing; its frame is removed once it has answered. */
async function turnstileToken(): Promise<string> {
  const turnstile = await loadTurnstile();
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;overflow:hidden;pointer-events:none';
  document.body.appendChild(container);
  let widget: string | undefined;
  try {
    return await new Promise<string>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Turnstile timed out')), CHECK_TIMEOUT_MS);
      const fail = (reason: string) => () => { window.clearTimeout(timer); reject(new Error(reason)); };
      widget = turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        action: MAP_PASS_ACTION,
        retry: 'never',
        'refresh-expired': 'never',
        'response-field': false,
        callback: (token: string) => { window.clearTimeout(timer); resolve(token); },
        'error-callback': fail('Turnstile failed'),
        'timeout-callback': fail('Turnstile timed out'),
        'unsupported-callback': fail('Turnstile is not supported'),
      });
    });
  } finally {
    if (widget) turnstile.remove(widget);
    container.remove();
  }
}

/** One try, after `delayMs`: Turnstile's token, then the pass for it. Whether the Worker gave it. */
function tryForPass(now: number, delayMs: number): Promise<boolean> {
  triedAt = now;
  running = (async () => {
    if (delayMs) await new Promise(resolve => window.setTimeout(resolve, delayMs));
    const token = await turnstileToken();
    const response = await fetch(MAP_PASS_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }), cache: 'no-store', signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
    return response.ok;
  })().catch(() => false).then(passed => {
    if (!passed) failedAt = Date.now();
    running = null;
    return passed;
  });
  return running;
}

/**
 * Asks for the map pass (src/lib/mapPass.ts) when an answer says this browser holds none: MAP_PASS_DELAY_MS
 * later, at most once every MAP_PASS_RETRY_MS, never while a try runs, and never in the way of the map, whose
 * requests go on meanwhile. Its network's first answers of the day come without a pass; past them the cache asks for
 * one first (server/visitorLedger.ts, PASS_GRACE_REQUESTS), and the map then gets it at once (mapPassNow).
 */
export function askForMapPass(now = Date.now()): void {
  if (!TURNSTILE_SITE_KEY || running || now - triedAt < MAP_PASS_RETRY_MS || typeof document === 'undefined') return;
  void tryForPass(now, MAP_PASS_DELAY_MS);
}

/**
 * The pass now, for an answer that asks for it first (428): the try under way, or a new one at once, unless one
 * failed within MAP_PASS_URGENT_RETRY_MS. Resolves to whether this browser was given one.
 */
export function mapPassNow(now = Date.now()): Promise<boolean> {
  if (!TURNSTILE_SITE_KEY || typeof document === 'undefined') return Promise.resolve(false);
  if (running) return running;
  if (now - failedAt < MAP_PASS_URGENT_RETRY_MS) return Promise.resolve(false);
  return tryForPass(now, 0);
}

/** The answer after a pass still asked for one, as where the browser keeps no cookie: the next try waits. */
export function noteMapPassUnheld(now = Date.now()): void {
  failedAt = now;
}

/** For the tests: forget the last try and the loaded script. */
export function resetMapPassForTests(): void {
  loading = null;
  triedAt = -Infinity;
  failedAt = -Infinity;
  running = null;
}
