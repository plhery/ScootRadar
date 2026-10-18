import { readFileSync } from 'node:fs';
import { holdOffMs, hostPacer } from './host-pacing.mjs';

// Checks the hand-kept prices of data/listed-prices.json, which the map shows where a feed
// publishes none. An entry last checked more than recheckAfterDays ago is stale: read its page
// again, change the price if it changed, and set checked to that day (the map drops an entry at
// staleAfterDays). A page that answers 404 or 410 is gone: find where the operator moved it.
// Each page is also searched for the amounts of its quote; a page that no longer shows them, or
// shows them only once a script has run, is listed to look at, without failing the run.
// --fail-on=stale, as the weekly workflow runs it, fails for a stale entry or a gone page;
// --fail-on=gone for a gone page only.
const failOn = process.argv.find(arg => arg.startsWith('--fail-on='))?.split('=')[1] ?? 'stale';
if (!['stale', 'gone'].includes(failOn)) throw new Error('Use --fail-on=stale or --fail-on=gone');
const catalog = JSON.parse(readFileSync(new URL('../data/listed-prices.json', import.meta.url), 'utf8'));
const headers = { Accept: 'text/html,application/xhtml+xml', 'User-Agent': 'scootradar/2.0 (scootradar.com)' };
const DAY_MS = 86_400_000;
const now = Date.now();

// Operators' sites, not their APIs: one request every three seconds to a host.
const pacer = hostPacer(3_000);

async function read(url) {
  await pacer.wait(url);
  try {
    const response = await fetch(url, { headers, redirect: 'follow', signal: AbortSignal.timeout(20_000) });
    if (response.status === 429 || response.status === 403) pacer.holdOff(url, holdOffMs(response));
    return { status: response.status, text: response.ok ? await response.text() : '' };
  } catch (error) {
    return { status: 0, text: '', error: error.message };
  }
}

/** The amounts a quote names, "1", "0.39" or "1,20", as a page would write them. */
const amounts = quote => [...quote.matchAll(/\d+(?:[.,]\d+)?/g)].map(match => match[0]);
const plain = text => text.replace(/[  ]/g, ' ');

const pages = new Map();
for (const url of new Set(catalog.prices.map(entry => entry.url))) pages.set(url, await read(url));

const report = { stale: 0, gone: 0, doubts: 0 };
for (const entry of catalog.prices) {
  const age = Math.floor((now - Date.parse(`${entry.checked}T00:00:00Z`)) / DAY_MS);
  const page = pages.get(entry.url);
  const stale = age > catalog.recheckAfterDays;
  const gone = page.status === 404 || page.status === 410;
  const missing = page.status >= 200 && page.status < 300
    ? amounts(entry.quote).filter(amount => !plain(page.text).includes(amount))
    : [];
  const unread = !gone && (page.status < 200 || page.status >= 300);
  const state = gone ? 'GONE' : stale ? 'STALE' : missing.length || unread ? 'LOOK' : 'ok';
  if (gone) report.gone += 1;
  if (stale) report.stale += 1;
  if (!gone && (missing.length || unread)) report.doubts += 1;
  const why = gone || unread
    ? `HTTP ${page.status || page.error}`
    : missing.length ? `page doesn't show ${missing.join(', ')}` : '';
  console.log(`${state.padEnd(5)} ${String(age).padStart(4)} d  ${entry.systems.join(', ')}  ${entry.url}${why ? `  (${why})` : ''}`);
}

console.log(`\n${catalog.prices.length} prices: ${report.stale} stale (over ${catalog.recheckAfterDays} days), ${report.gone} gone, ${report.doubts} to look at.`);
if (report.gone > 0 || (failOn === 'stale' && report.stale > 0)) process.exitCode = 1;
