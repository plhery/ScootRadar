// Tells IndexNow which pages a deploy added to the sitemap or redated, so that Bing, and the other
// engines that read its index, read them within days rather than at their next crawl. CI's Deploy
// job saves the live sitemap before it moves `production`, and runs this once Workers Builds has
// put that commit live (DEPLOY.md):
//
//   node scripts/indexnow.mjs --before=<saved sitemap> https://scootradar.com
//   node scripts/indexnow.mjs --all https://scootradar.com     (every page of the sitemap)
//
// A page is submitted when it is new or its <lastmod> changed; one that left the sitemap is
// not. Without a saved sitemap nothing is submitted. --dry-run lists the pages and sends
// nothing; --endpoint=<url> asks one engine directly, such as https://www.bing.com/indexnow.
// A refusal or an unreachable engine exits with 1, which the deploy shows but ignores.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/**
 * The key that shows IndexNow the site is ours. It is public by design: the file of its name in
 * `public` holds it, at the root, where it vouches for every page.
 */
export const INDEXNOW_KEY = 'f165a5c7a3d4199af0d0bc0b01c6e4e7'; // gitleaks:allow -- public by design, served from public/
export const DEFAULT_ENDPOINT = 'https://api.indexnow.org/indexnow';
export const MAX_URLS_PER_REQUEST = 10_000;
const TIMEOUT_MS = 30_000;
const USAGE = 'Usage: node scripts/indexnow.mjs (--before=<saved sitemap> | --all) [--dry-run] [--endpoint=<url>] https://scootradar.com';

/** @type {Record<string, string>} */
const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** XML text as it reads: the five named entities and the character references decoded. */
export function decodeXml(/** @type {string} */ text) {
  return text.replace(/&(?:#x([0-9a-fA-F]+)|#([0-9]+)|(amp|lt|gt|quot|apos));/g, (whole, hex, decimal, name) => {
    if (name) return entities[name];
    const code = hex ? parseInt(hex, 16) : Number(decimal);
    return code <= 0x10ffff ? String.fromCodePoint(code) : whole;
  });
}

/**
 * The pages of a sitemap: each `<url>`'s address, and its `<lastmod>` or null.
 * @param {string} xml
 * @returns {{ url: string, lastmod: string | null }[]}
 */
export function parseSitemap(xml) {
  const pages = [];
  for (const [, entry] of xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/g)) {
    const loc = entry.match(/<loc>([\s\S]*?)<\/loc>/)?.[1];
    if (!loc) continue;
    const lastmod = entry.match(/<lastmod>([\s\S]*?)<\/lastmod>/)?.[1];
    pages.push({ url: decodeXml(loc.trim()), lastmod: lastmod === undefined ? null : decodeXml(lastmod.trim()) });
  }
  return pages;
}

function onHost(/** @type {string} */ address, /** @type {string} */ host) {
  try {
    return new URL(address).host === host;
  } catch {
    return false;
  }
}

/**
 * The addresses to submit: the pages of `after` on `host` that `before` lacks or dates
 * otherwise, or all of them without `before`.
 * @param {{ url: string, lastmod: string | null }[]} after
 * @param {{ url: string, lastmod: string | null }[] | null} before
 * @param {string} host
 */
export function pagesToSubmit(after, before, host) {
  const dated = before ? new Map(before.map(({ url, lastmod }) => [url, lastmod])) : null;
  const urls = new Set();
  for (const { url, lastmod } of after) {
    if (!onHost(url, host)) continue;
    if (dated?.has(url) && dated.get(url) === lastmod) continue;
    urls.add(url);
  }
  return [...urls];
}

/** What IndexNow is sent: at most 10,000 addresses a request, with the key and where it is. */
export function requestBodies(/** @type {string[]} */ urls, /** @type {string} */ origin) {
  const { host } = new URL(origin);
  const keyLocation = new URL(`/${INDEXNOW_KEY}.txt`, origin).href;
  const bodies = [];
  for (let start = 0; start < urls.length; start += MAX_URLS_PER_REQUEST) {
    bodies.push({ host, key: INDEXNOW_KEY, keyLocation, urlList: urls.slice(start, start + MAX_URLS_PER_REQUEST) });
  }
  return bodies;
}

const reason = (/** @type {unknown} */ error) => (error instanceof Error
  ? [error.message, /** @type {Error | undefined} */ (error.cause)?.message].filter(Boolean).join(': ')
  : String(error));

/**
 * Submits the addresses and prints the status of each request. Stops at the first refusal or
 * failure, which it reports rather than throws. Returns how many addresses were accepted.
 * @param {string[]} urls
 * @param {string} origin
 * @param {{ endpoint?: string, fetchImpl?: typeof fetch, log?: (line: string) => void }} [options]
 */
export async function submit(urls, origin, { endpoint = DEFAULT_ENDPOINT, fetchImpl = fetch, log = console.log } = {}) {
  let accepted = 0;
  for (const body of requestBodies(urls, origin)) {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      log(`${endpoint} could not be reached with ${body.urlList.length} pages: ${reason(error)}`);
      return accepted;
    }
    await response.body?.cancel().catch(() => {});
    log(`${endpoint} answered HTTP ${response.status} to ${body.urlList.length} pages`);
    if (!response.ok) return accepted;
    accepted += body.urlList.length;
  }
  return accepted;
}

async function readSitemap(/** @type {string} */ origin, /** @type {typeof fetch} */ fetchImpl) {
  const response = await fetchImpl(new URL('/sitemap.xml', origin).href, {
    headers: { 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return parseSitemap(await response.text());
}

function readSaved(/** @type {string} */ file) {
  try {
    return parseSitemap(readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function httpOrigin(/** @type {string} */ address) {
  try {
    const url = new URL(address);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Runs the command line `args` and returns its exit code.
 * @param {string[]} args
 * @param {{ fetchImpl?: typeof fetch, log?: (line: string) => void }} [options]
 */
export async function run(args, { fetchImpl = fetch, log = console.log } = {}) {
  const flags = new Set();
  const values = new Map();
  const positional = [];
  for (const argument of args) {
    const option = argument.match(/^--(?:(all|dry-run)|(before|endpoint)=(.+))$/);
    if (option?.[1]) flags.add(option[1]);
    else if (option) values.set(option[2], option[3]);
    else positional.push(argument);
  }
  const origin = positional.length === 1 && !positional[0].startsWith('--') ? httpOrigin(positional[0]) : null;
  const before = values.get('before');
  const endpoint = values.get('endpoint') ?? DEFAULT_ENDPOINT;
  if (!origin || !httpOrigin(endpoint) || flags.has('all') === (before !== undefined)) {
    log(USAGE);
    return 2;
  }

  let saved = null;
  if (before !== undefined) {
    saved = readSaved(before);
    if (saved.length === 0) {
      log(`${before} holds no sitemap saved before the deploy: nothing is submitted. --all submits every page.`);
      return 0;
    }
  }
  let pages;
  try {
    pages = await readSitemap(origin, fetchImpl);
  } catch (error) {
    log(`${origin}/sitemap.xml could not be read: ${reason(error)}`);
    return 1;
  }
  const { host } = new URL(origin);
  const urls = pagesToSubmit(pages, saved, host);
  const elsewhere = pages.filter(page => !onHost(page.url, host)).length;
  log(`${origin}/sitemap.xml lists ${pages.length} pages, ${urls.length} of them ${saved ? 'new or redated' : `on ${host}`}.`
    + (elsewhere ? ` ${elsewhere} on another host are left out.` : ''));
  if (urls.length === 0) {
    log('Nothing to submit.');
    return 0;
  }
  if (flags.has('dry-run')) {
    for (const url of urls) log(url);
    log(`Dry run: ${urls.length} pages would go to ${endpoint} in ${requestBodies(urls, origin).length} requests. Nothing was sent.`);
    return 0;
  }
  const accepted = await submit(urls, origin, { endpoint, fetchImpl, log });
  log(`Submitted ${accepted} of ${urls.length} pages to ${endpoint}.`);
  return accepted === urls.length ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await run(process.argv.slice(2));
}
