import { build } from 'esbuild';
import { convertV4MiniflareOptions, Miniflare } from 'miniflare';
import { expect, it } from 'vitest';

// worker.ts and what it imports read the settings when they are loaded, from the Worker's vars, which the runtime
// puts in process.env under nodejs_compat (wrangler.jsonc). The Next.js pages have them written in at build instead.
async function settingsIn(bindings: Record<string, string>) {
  const bundle = await build({
    stdin: {
      contents: `import { GUIDES_PUBLISHED, SITE_HOST, SITE_NAME, SITE_URL } from './src/lib/site';
        import { SERVICE_USER_AGENT } from './src/lib/serviceIdentity';
        import { legacyHostRedirect } from './src/lib/legacyHost';
        const loaded = { SITE_URL, SITE_NAME, SITE_HOST, GUIDES_PUBLISHED, SERVICE_USER_AGENT };
        export default { fetch(request) {
          const moved = legacyHostRedirect(new Request('https://www.' + SITE_HOST + '/de'));
          return Response.json({ ...loaded, moved: moved && moved.headers.get('Location') });
        } };`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'browser',
  });
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, compatibilityDate: '2026-07-13', compatibilityFlags: ['nodejs_compat'], script: bundle.outputFiles[0].text,
    bindings,
  }));
  try {
    return await (await runtime.dispatchFetch('https://worker.example/')).json();
  } finally {
    await runtime.dispose();
  }
}

it('reads the deployment\'s vars when the Worker is loaded', async () => {
  expect(await settingsIn({ SITE_URL: 'https://scootradar.com', SITE_NAME: 'ScootRadar', SITE_GUIDES: 'on' })).toEqual({
    SITE_URL: 'https://scootradar.com', SITE_NAME: 'ScootRadar', SITE_HOST: 'scootradar.com', GUIDES_PUBLISHED: true,
    SERVICE_USER_AGENT: 'scootradar/2.0 (scootradar.com)', moved: 'https://scootradar.com/de',
  });
}, 30_000);

it('is a neutral site of its own without them', async () => {
  expect(await settingsIn({})).toEqual({
    SITE_URL: 'http://localhost:3000', SITE_NAME: 'Scooter map', SITE_HOST: 'localhost', GUIDES_PUBLISHED: false,
    SERVICE_USER_AGENT: 'scooter-map/2.0 (localhost:3000)', moved: 'https://localhost/de',
  });
}, 30_000);
