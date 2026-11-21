// A module of src for a script, bundled with what it imports, and with the deployment's settings (the vars of
// wrangler.jsonc) written in where src/lib/site.ts reads them, as the build does (next.config.ts).

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function bundled(file, define = {}) {
  const { outputFiles: [bundle] } = await build({
    entryPoints: [path.join(root, file)], bundle: true, format: 'esm', platform: 'node', write: false, define, logLevel: 'silent',
    absWorkingDir: root,
  });
  return import(`data:text/javascript;base64,${Buffer.from(bundle.text).toString('base64')}`);
}

const { siteSettings } = await bundled('src/lib/siteSettings.ts');
const { wranglerVars } = await bundled('src/lib/wranglerVars.ts');

export const SITE_SETTINGS = siteSettings(wranglerVars(root));

export function loadSiteModule(file) {
  return bundled(file, Object.fromEntries(Object.entries(SITE_SETTINGS).map(([name, value]) => [`process.env.${name}`, JSON.stringify(value)])));
}
