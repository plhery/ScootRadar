import { MAP_PASS_ACTION, MAP_PASS_PATH } from '@/lib/mapPass';

/**
 * The web map's Turnstile widget (DEPLOY.md, "Map passes"): invisible, for scootradar.com. Its secret is the
 * Worker's TURNSTILE_SECRET_KEY.
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAGHng4PaY6p_ONop';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
/** After a try, passed or not, the next waits this long: a pass lasts a day, and a refused browser stays refused. */
export const MAP_PASS_RETRY_MS = 10 * 60_000;
/** How long after the answer that asks for it the check starts: the map, its tiles and scooters, come first. */
export const MAP_PASS_DELAY_MS = 3_000;
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
let running = false;

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

/**
 * Asks for the map pass (src/lib/mapPass.ts) when an answer says this browser holds none: MAP_PASS_DELAY_MS
 * later, at most once every MAP_PASS_RETRY_MS, never while a try runs, and never in the way of the map, whose
 * requests go on meanwhile.
 * A browser that blocks Turnstile, or that it refuses, is served as before; only a script's requests, or those
 * of a map that is not verified past its daily allowance once that is enforced, are answered from what the
 * cache holds (server/visitorLedger.ts).
 */
export function askForMapPass(now = Date.now()): void {
  if (running || now - triedAt < MAP_PASS_RETRY_MS || typeof document === 'undefined') return;
  triedAt = now;
  running = true;
  void (async () => {
    await new Promise(resolve => window.setTimeout(resolve, MAP_PASS_DELAY_MS));
    const token = await turnstileToken();
    await fetch(MAP_PASS_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
      cache: 'no-store', signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
  })().catch(() => {}).finally(() => { running = false; });
}

/** For the tests: forget the last try and the loaded script. */
export function resetMapPassForTests(): void {
  loading = null;
  triedAt = -Infinity;
  running = false;
}
