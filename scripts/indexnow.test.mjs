import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_ENDPOINT, INDEXNOW_KEY, MAX_URLS_PER_REQUEST, decodeXml, pagesToSubmit, parseSitemap, requestBodies, run, submit,
} from './indexnow.mjs';

const origin = 'https://scootradar.example.test';
const host = 'scootradar.example.test';
const page = (/** @type {string} */ url, /** @type {string | null} */ lastmod = null) => ({ url, lastmod });
// As src/app/sitemap.ts writes it: each page names its translations, and the map has no date.
const sitemap = (/** @type {{ url: string, lastmod: string | null }[]} */ pages) => '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + pages.map(({ url, lastmod }) => `<url>\n<loc>${url}</loc>\n<xhtml:link rel="alternate" hreflang="de" href="${url}/de" />\n`
    + (lastmod ? `<lastmod>${lastmod}</lastmod>\n` : '') + '<changefreq>monthly</changefreq>\n</url>\n').join('')
  + '</urlset>\n';

/** A fetch that serves `xml` as the live sitemap and answers IndexNow with `status`. */
function engine(/** @type {string | null} */ xml, status = 200) {
  /** @type {{ url: string, body: { urlList: string[] } }[]} */
  const posts = [];
  /** @type {string[]} */
  const gets = [];
  /** @type {typeof fetch} */
  const fetchImpl = async (url, init = {}) => {
    if (init.method === 'POST') {
      posts.push({ url: String(url), body: JSON.parse(String(init.body)) });
      return new Response(null, { status });
    }
    gets.push(String(url));
    return xml === null ? new Response('gone', { status: 503 }) : new Response(xml, { status: 200 });
  };
  return { fetchImpl, posts, gets };
}

describe('the IndexNow key', () => {
  // Workers serves the files of public/ before worker.ts runs, so neither the redirect of the
  // other hosts nor the pages' Content-Security-Policy reaches it.
  it('is served as is from the root, named after itself, where it vouches for every page', () => {
    expect(INDEXNOW_KEY).toMatch(/^[0-9a-f]{32}$/);
    const publicDirectory = new URL('../public/', import.meta.url);
    expect(readFileSync(new URL(`${INDEXNOW_KEY}.txt`, publicDirectory), 'utf8')).toBe(INDEXNOW_KEY);
    expect(readdirSync(publicDirectory).filter(name => /^[0-9a-f]{32}\.txt$/.test(name))).toEqual([`${INDEXNOW_KEY}.txt`]);
  });
});

describe('reading a sitemap', () => {
  it('reads each page and its date, decoding what XML escapes', () => {
    expect(decodeXml('a&amp;b &lt;&gt; &quot;&apos; &#38;&#x26; &amp;amp;')).toBe('a&b <> "\' && &amp;');
    expect(parseSitemap(sitemap([
      page('https://scootradar.example.test/map'),
      page('https://scootradar.example.test/fr/guides/r&amp;d?a=1&amp;b=&apos;2&apos;', '2026-10-17T00:00:00.000Z'),
    ]))).toEqual([
      page('https://scootradar.example.test/map'),
      page("https://scootradar.example.test/fr/guides/r&d?a=1&b='2'", '2026-10-17T00:00:00.000Z'),
    ]);
    expect(parseSitemap('<html>Bad gateway</html>')).toEqual([]);
  });
});

describe('choosing the pages', () => {
  const before = [
    page(`${origin}/`, '2026-10-12T00:00:00.000Z'),
    page(`${origin}/guides/a`, '2026-10-01T00:00:00.000Z'),
    page(`${origin}/guides/b`, '2026-10-01T00:00:00.000Z'),
    page(`${origin}/guides/gone`, '2026-10-01T00:00:00.000Z'),
  ];
  const afterDeploy = [
    page(`${origin}/`, '2026-10-12T00:00:00.000Z'),
    page(`${origin}/guides/a`, '2026-10-01T00:00:00.000Z'),
    page(`${origin}/guides/b`, '2026-10-17T00:00:00.000Z'),
    page(`${origin}/guides/new`, '2026-10-17T00:00:00.000Z'),
    page(`${origin}/map`),
    page('https://other.example.test/guides/new', '2026-10-17T00:00:00.000Z'),
    page('not an address'),
  ];

  it("submits the pages that are new or redated, on the site's host only", () => {
    expect(pagesToSubmit(afterDeploy, before, host)).toEqual([`${origin}/guides/b`, `${origin}/guides/new`, `${origin}/map`]);
  });

  it('submits a page that gains or loses its date, and each page once', () => {
    expect(pagesToSubmit([page(`${origin}/a`, '2026-10-17'), page(`${origin}/b`)], [page(`${origin}/a`), page(`${origin}/b`, '2026-10-01')], host))
      .toEqual([`${origin}/a`, `${origin}/b`]);
    expect(pagesToSubmit([page(`${origin}/a`), page(`${origin}/a`)], [], host)).toEqual([`${origin}/a`]);
  });

  it('submits every page of the host without a sitemap to compare with', () => {
    expect(pagesToSubmit(afterDeploy, null, host)).toHaveLength(5);
  });
});

describe('submitting', () => {
  it('sends the pages with the key and where to find it', () => {
    expect(requestBodies([`${origin}/guides/new`], origin)).toEqual([{
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${origin}/${INDEXNOW_KEY}.txt`,
      urlList: [`${origin}/guides/new`],
    }]);
  });

  it('sends at most ten thousand pages a request', async () => {
    const urls = Array.from({ length: MAX_URLS_PER_REQUEST * 2 + 1 }, (_, index) => `${origin}/p${index}`);
    expect(requestBodies(urls, origin).map(body => body.urlList.length)).toEqual([10_000, 10_000, 1]);
    const { fetchImpl, posts } = engine('', 202);
    /** @type {string[]} */
    const lines = [];
    expect(await submit(urls, origin, { fetchImpl, log: line => lines.push(line) })).toBe(urls.length);
    expect(posts.map(post => post.url)).toEqual([DEFAULT_ENDPOINT, DEFAULT_ENDPOINT, DEFAULT_ENDPOINT]);
    expect(posts.flatMap(post => post.body.urlList)).toEqual(urls);
    expect(lines).toEqual([10_000, 10_000, 1].map(count => `${DEFAULT_ENDPOINT} answered HTTP 202 to ${count} pages`));
  });

  it('reports a refusal or an unreachable engine instead of throwing, and stops there', async () => {
    const urls = Array.from({ length: MAX_URLS_PER_REQUEST + 1 }, (_, index) => `${origin}/p${index}`);
    const refused = engine('', 403);
    /** @type {string[]} */
    const lines = [];
    expect(await submit(urls, origin, { fetchImpl: refused.fetchImpl, log: line => lines.push(line) })).toBe(0);
    expect(refused.posts).toHaveLength(1);
    expect(lines).toEqual([`${DEFAULT_ENDPOINT} answered HTTP 403 to 10000 pages`]);

    const offline = async () => { throw new TypeError('fetch failed', { cause: new Error('getaddrinfo ENOTFOUND') }); };
    lines.length = 0;
    expect(await submit(urls, origin, { fetchImpl: offline, log: line => lines.push(line) })).toBe(0);
    expect(lines).toEqual([`${DEFAULT_ENDPOINT} could not be reached with 10000 pages: fetch failed: getaddrinfo ENOTFOUND`]);
  });
});

describe('the command', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'indexnow-'));
  afterAll(() => rmSync(directory, { recursive: true, force: true }));
  const saved = (/** @type {string} */ name, /** @type {string} */ text) => {
    const file = path.join(directory, name);
    writeFileSync(file, text);
    return file;
  };
  const live = sitemap([page(`${origin}/`), page(`${origin}/guides/a`, '2026-10-17'), page(`${origin}/guides/new`, '2026-10-17')]);
  const command = async (/** @type {string[]} */ args, /** @type {string | null} */ xml = live, status = 200) => {
    /** @type {string[]} */
    const lines = [];
    const io = engine(xml, status);
    const code = await run(args, { fetchImpl: io.fetchImpl, log: line => lines.push(line) });
    return { code, lines, ...io };
  };

  it('submits what changed since the sitemap saved before the deploy', async () => {
    const before = saved('before.xml', sitemap([page(`${origin}/`), page(`${origin}/guides/a`, '2026-10-01')]));
    const { code, lines, gets, posts } = await command([`--before=${before}`, `${origin}/`]);
    expect(code).toBe(0);
    expect(gets).toEqual([`${origin}/sitemap.xml`]);
    expect(posts.map(post => post.body.urlList)).toEqual([[`${origin}/guides/a`, `${origin}/guides/new`]]);
    expect(lines.at(-1)).toBe(`Submitted 2 of 2 pages to ${DEFAULT_ENDPOINT}.`);
  });

  it('submits nothing, and says so, without a saved sitemap', async () => {
    for (const before of [path.join(directory, 'missing.xml'), saved('empty.xml', ''), saved('error.html', '<html>Bad gateway</html>')]) {
      const { code, lines, gets, posts } = await command([`--before=${before}`, origin]);
      expect(code).toBe(0);
      expect(gets.length + posts.length).toBe(0);
      expect(lines.join('\n')).toMatch(/nothing is submitted/);
    }
  });

  it('submits every page with --all, to the engine asked', async () => {
    const { code, posts } = await command(['--all', '--endpoint=https://www.bing.com/indexnow', origin]);
    expect(code).toBe(0);
    expect(posts[0].url).toBe('https://www.bing.com/indexnow');
    expect(posts[0].body.urlList).toHaveLength(3);
  });

  it('lists the pages without sending them on a dry run', async () => {
    const { code, lines, posts } = await command(['--all', '--dry-run', origin]);
    expect(code).toBe(0);
    expect(posts).toHaveLength(0);
    expect(lines.at(-1)).toMatch(/^Dry run: 3 pages would go to .* in 1 requests\. Nothing was sent\.$/);
  });

  it('exits with 1 when IndexNow refuses or the sitemap cannot be read, and 2 when misused', async () => {
    expect((await command(['--all', origin], live, 429)).code).toBe(1);
    expect((await command(['--all', origin], null)).code).toBe(1);
    for (const args of [[origin], ['--all', `--before=${path.join(directory, 'x')}`, origin], ['--all'],
      ['--all', 'scootradar.example.test'], ['--all', '--endpoint=nowhere', origin], ['--all', '--everything', origin]]) {
      expect((await command(args)).code, args.join(' ')).toBe(2);
    }
  });
});
