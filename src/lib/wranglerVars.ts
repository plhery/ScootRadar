// The `vars` of wrangler.jsonc, for what reads them outside the Worker: the build (next.config.ts),
// the tests (vitest.config.mts) and the scripts. Node only.

import { readFileSync } from 'node:fs';
import path from 'node:path';

/** The vars of the wrangler.jsonc in a folder, the project's by default. */
export function wranglerVars(folder = process.cwd()): Record<string, unknown> {
  const config = parseJsonc(readFileSync(path.join(folder, 'wrangler.jsonc'), 'utf8'));
  if (!config || typeof config !== 'object') throw new Error('wrangler.jsonc holds no object');
  const { vars } = config as { vars?: unknown };
  if (vars === undefined) return {};
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) throw new Error('The vars of wrangler.jsonc are not an object');
  return vars as Record<string, unknown>;
}

/** JSON with comments (// and /* *\/) and commas before a closing bracket, as wrangler reads it. */
export function parseJsonc(text: string): unknown {
  let json = '';
  for (let at = 0; at < text.length; at++) {
    const char = text[at];
    if (char === '"') {
      const end = stringEnd(text, at);
      json += text.slice(at, end);
      at = end - 1;
    } else if (char === '/' && text[at + 1] === '/') {
      while (at < text.length && text[at] !== '\n') at++;
      json += '\n';
    } else if (char === '/' && text[at + 1] === '*') {
      const end = text.indexOf('*/', at + 2);
      if (end < 0) throw new Error('A comment of wrangler.jsonc is not closed');
      at = end + 1;
    } else {
      json += char;
    }
  }
  return JSON.parse(json.replace(/,(\s*[}\]])/g, '$1'));
}

/** Where the string that opens at a quote ends, past its closing quote. */
function stringEnd(text: string, open: number): number {
  for (let at = open + 1; at < text.length; at++) {
    if (text[at] === '\\') at++;
    else if (text[at] === '"') return at + 1;
  }
  throw new Error('A string of wrangler.jsonc is not closed');
}
