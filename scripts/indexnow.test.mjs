import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  DEFAULT_ENDPOINT, INDEXNOW_KEY, MAX_URLS_PER_REQUEST, STALE_READS, decodeXml, notTheBuild, pagesToSubmit, parseSitemap, readSubmitted,
  requestBodies, run, submit,
} from './indexnow.mjs';

const origin = 'https://scootradar.example.test';
const host = 'scootradar.example.test';
// Made-up commits: the one production moved to, and the one before.
const build = '1111111111111111111111111111111111111111';
const buildBefore = '2222222222222222222222222222222222222222';
const page = (/** @type {string} */ url, /** @type {string | null} */ lastmod = null) => ({ url, lastmod });
// As src/app/sitemap.ts writes it: each page names its translations, and the map has no date.
const sitemap = (/** @type {{ url: string, lastmod: string | null }[]} */ pages) => '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
  + pages.map(({ url, lastmod }) => `<url>\n<loc>${url}</loc>\n<xhtml:link rel="alternate" hreflang="de" href="${url}/de" />\n`
    + (lastmod ? `<lastmod>${lastmod}</lastmod>\n` : '') + '<changefreq>monthly</changefreq>\n</url>\n').join('')
  + '</urlset>\n';

/**
 * A fetch that serves `xml` as the live sitemap, from `build`, and answers IndexNow with `status`.
 * The sitemaps of `stale` come first: a text is marked as Next.js marks the build before's while it
 * renders the new one, and `{ xml, from }` comes unmarked from the build `from`, or none.
 */
function engine(/** @type {string | null} */ xml, status = 200,
  /** @type {(string | { xml: string, from: string | null })[]} */ stale = []) {
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
    const before = stale[gets.length - 1];
    if (typeof before === 'string') return new Response(before, { status: 200, headers: { 'x-nextjs-cache': 'STALE' } });
    if (before) return new Response(before.xml, { status: 200, headers: before.from ? { 'x-scootradar-build': before.from } : {} });
    return xml === null ? new Response('gone', { status: 503 }) : new Response(xml, { status: 200, headers: { 'x-scootradar-build': build } });
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
  const ref = 'refs/indexnow/submitted';
  // A clone whose origin is a bare repository, as CI's checkout of the site's.
  let clones = 0;
  const repository = () => {
    const root = path.join(directory, `repository-${clones += 1}`);
    const clone = path.join(root, 'clone');
    mkdirSync(clone, { recursive: true });
    const git = (/** @type {string[]} */ ...args) => execFileSync('git', args, { cwd: clone, encoding: 'utf8' }).trim();
    execFileSync('git', ['init', '--quiet', '--bare', path.join(root, 'origin.git')]);
    git('init', '--quiet');
    git('config', 'user.name', 'CI');
    git('config', 'user.email', 'ci@example.com');
    git('remote', 'add', 'origin', path.join(root, 'origin.git'));
    const atOrigin = () => git('ls-remote', 'origin', ref).split('\t')[0] || null;
    return { clone, git, atOrigin };
  };
  const live = sitemap([page(`${origin}/`), page(`${origin}/guides/a`, '2026-10-17'), page(`${origin}/guides/new`, '2026-10-17')]);
  const command = async (/** @type {string[]} */ args, /** @type {string | null} */ xml = live, status = 200, cwd = directory,
    /** @type {(string | { xml: string, from: string | null })[]} */ stale = []) => {
    /** @type {string[]} */
    const lines = [];
    /** @type {number[]} */
    const waits = [];
    const io = engine(xml, status, stale);
    const code = await run(args, { fetchImpl: io.fetchImpl, log: line => lines.push(line), cwd, wait: async ms => waits.push(ms) });
    return { code, lines, waits, ...io };
  };
  const staleLine = (/** @type {number} */ read) => `${origin}/sitemap.xml is stale, reading again in 5 s (read ${read} of ${STALE_READS}).`;

  it('starts the ref at the live sitemap, submitting nothing, where origin has none', async () => {
    const { clone, atOrigin } = repository();
    const dry = await command([`--since=${ref}`, '--dry-run', origin], live, 200, clone);
    expect([dry.code, dry.posts.length, atOrigin()]).toEqual([0, 0, null]);
    const { code, lines, posts } = await command([`--since=${ref}`, origin], live, 200, clone);
    expect(code).toBe(0);
    expect(posts).toHaveLength(0);
    expect(lines.join('\n')).toMatch(/nothing is submitted/);
    expect(readSubmitted(ref, clone)?.xml).toBe(live);
  });

  it('submits what changed since the sitemap IndexNow last took, then moves the ref to the live one', async () => {
    const { clone, git, atOrigin } = repository();
    const earlier = sitemap([page(`${origin}/`), page(`${origin}/guides/a`, '2026-10-01'), page(`${origin}/guides/gone`, '2026-10-01')]);
    await command([`--since=${ref}`, origin], earlier, 200, clone);
    const start = atOrigin();
    const { code, lines, gets, posts } = await command([`--since=${ref}`, `${origin}/`], live, 200, clone);
    expect(code).toBe(0);
    expect(gets).toEqual([`${origin}/sitemap.xml`]);
    expect(posts.map(post => post.body.urlList)).toEqual([[`${origin}/guides/a`, `${origin}/guides/new`]]);
    expect(lines).toContain(`Submitted 2 of 2 pages to ${DEFAULT_ENDPOINT}.`);
    expect(readSubmitted(ref, clone)?.xml).toBe(live);
    expect(git('rev-parse', `${atOrigin()}^`)).toBe(start);
  });

  it('keeps the ref where it is until IndexNow takes the pages, so a later run sends them', async () => {
    const { clone, atOrigin } = repository();
    await command([`--since=${ref}`, origin], sitemap([page(`${origin}/`)]), 200, clone);
    const start = atOrigin();
    // A refusal, then a deploy that changed nothing: the pages wait for a run IndexNow answers.
    expect((await command([`--since=${ref}`, origin], live, 429, clone)).code).toBe(1);
    expect(atOrigin()).toBe(start);
    const { code, posts } = await command([`--since=${ref}`, origin], live, 200, clone);
    expect(code).toBe(0);
    expect(posts.map(post => post.body.urlList)).toEqual([[`${origin}/guides/a`, `${origin}/guides/new`]]);
    expect(atOrigin()).not.toBe(start);
    // Then nothing is new, and the ref stays.
    const moved = atOrigin();
    const again = await command([`--since=${ref}`, origin], live, 200, clone);
    expect([again.code, again.posts.length, again.lines.at(-1), atOrigin()]).toEqual([0, 0, 'Nothing to submit.', moved]);
  });

  it('reads the sitemap again while Next.js serves the build before\'s, and submits the new one', async () => {
    const { clone } = repository();
    const earlier = sitemap([page(`${origin}/`)]);
    await command([`--since=${ref}`, origin], earlier, 200, clone);
    const { code, lines, gets, waits, posts } = await command([`--since=${ref}`, origin], live, 200, clone, [earlier, earlier]);
    expect(code).toBe(0);
    expect([gets.length, waits]).toEqual([3, [5000, 5000]]);
    expect(lines.slice(0, 2)).toEqual([staleLine(1), staleLine(2)]);
    expect(posts.map(post => post.body.urlList)).toEqual([[`${origin}/guides/a`, `${origin}/guides/new`]]);
    expect(readSubmitted(ref, clone)?.xml).toBe(live);
  });

  it('sends nothing and keeps the ref when the sitemap stays stale, so a later run sends the pages', async () => {
    const { clone, atOrigin } = repository();
    const earlier = sitemap([page(`${origin}/`)]);
    await command([`--since=${ref}`, origin], earlier, 200, clone);
    const start = atOrigin();
    const stale = Array(STALE_READS).fill(earlier);
    const { code, lines, gets, waits, posts } = await command([`--since=${ref}`, origin], live, 200, clone, stale);
    expect([code, gets.length, waits.length, posts.length]).toEqual([1, STALE_READS, STALE_READS - 1, 0]);
    expect(lines).toEqual([
      ...Array.from({ length: STALE_READS - 1 }, (_, index) => staleLine(index + 1)),
      `${origin}/sitemap.xml could not be read: still stale after ${STALE_READS} reads`,
    ]);
    expect(atOrigin()).toBe(start);
  });

  it('reads the sitemap again while the build before still answers it, and submits the new build\'s', async () => {
    const { clone, atOrigin } = repository();
    const earlier = sitemap([page(`${origin}/`)]);
    await command([`--since=${ref}`, origin], earlier, 200, clone);
    const start = atOrigin();
    const { code, lines, gets, waits, posts } = await command([`--since=${ref}`, `--build=${build}`, origin], live, 200, clone,
      [{ xml: earlier, from: buildBefore }, { xml: earlier, from: null }]);
    expect(code).toBe(0);
    expect([gets.length, waits]).toEqual([3, [5000, 5000]]);
    expect(lines.slice(0, 2)).toEqual([
      `${origin}/sitemap.xml is from build 2222222, not 1111111, reading again in 5 s (read 1 of ${STALE_READS}).`,
      `${origin}/sitemap.xml is from no named build, not 1111111, reading again in 5 s (read 2 of ${STALE_READS}).`,
    ]);
    expect(posts.map(post => post.body.urlList)).toEqual([[`${origin}/guides/a`, `${origin}/guides/new`]]);
    expect(readSubmitted(ref, clone)?.xml).toBe(live);
    expect(atOrigin()).not.toBe(start);
  });

  it('sends nothing and keeps the ref when the build before keeps answering, so a later run sends the pages', async () => {
    const { clone, atOrigin } = repository();
    const earlier = sitemap([page(`${origin}/`)]);
    await command([`--since=${ref}`, origin], earlier, 200, clone);
    const start = atOrigin();
    const stale = Array(STALE_READS).fill({ xml: earlier, from: buildBefore });
    const { code, lines, gets, posts } = await command([`--since=${ref}`, `--build=${build.slice(0, 7)}`, origin], live, 200, clone, stale);
    expect([code, gets.length, posts.length]).toEqual([1, STALE_READS, 0]);
    expect(lines.at(-1)).toBe(`${origin}/sitemap.xml could not be read: still from build 2222222, not 1111111 after ${STALE_READS} reads`);
    expect(atOrigin()).toBe(start);
  });

  it('takes any build\'s sitemap without --build, as a run by hand does', async () => {
    const { code, gets, posts } = await command(['--all', origin], live, 200, directory, [{ xml: live, from: buildBefore }]);
    expect([code, gets.length, posts[0].body.urlList.length]).toEqual([0, 1, 3]);
    const headers = (/** @type {Record<string, string>} */ fields) => new Headers(fields);
    expect(notTheBuild(headers({ 'x-scootradar-build': buildBefore }), undefined)).toBeNull();
    expect(notTheBuild(headers({ 'x-scootradar-build': build.toUpperCase() }), build)).toBeNull();
    expect(notTheBuild(headers({ 'x-scootradar-build': build, 'x-nextjs-cache': 'STALE' }), build)).toBe('stale');
  });

  it('lists the pages without sending them or moving the ref on a dry run', async () => {
    const { clone, atOrigin } = repository();
    await command([`--since=${ref}`, origin], sitemap([page(`${origin}/`)]), 200, clone);
    const start = atOrigin();
    const { code, lines, posts } = await command([`--since=${ref}`, '--dry-run', origin], live, 200, clone);
    expect(code).toBe(0);
    expect(posts).toHaveLength(0);
    expect(lines.at(-1)).toMatch(/^Dry run: 2 pages would go to .* in 1 requests\. Nothing was sent\.$/);
    expect(atOrigin()).toBe(start);
  });

  it('submits every page with --all, to the engine asked', async () => {
    const { code, posts } = await command(['--all', '--endpoint=https://www.bing.com/indexnow', origin]);
    expect(code).toBe(0);
    expect(posts[0].url).toBe('https://www.bing.com/indexnow');
    expect(posts[0].body.urlList).toHaveLength(3);
  });

  it('exits with 1 when IndexNow refuses or the sitemap cannot be read or lists nothing, and 2 when misused', async () => {
    expect((await command(['--all', origin], live, 429)).code).toBe(1);
    expect((await command(['--all', origin], null)).code).toBe(1);
    expect((await command(['--all', origin], '<html>Bad gateway</html>')).code).toBe(1);
    for (const args of [[origin], ['--all', `--since=${ref}`, origin], [`--since=indexnow`, origin], ['--all'],
      ['--all', 'scootradar.example.test'], ['--all', '--endpoint=nowhere', origin], ['--all', '--everything', origin],
      ['--all', '--build=production', origin], ['--all', '--build=111111', origin]]) {
      expect((await command(args)).code, args.join(' ')).toBe(2);
    }
  });
});
