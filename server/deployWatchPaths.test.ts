import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { expect, it } from 'vitest';

// Coolify redeploys the cache when a push to main changes a file these paths
// match: they are its application's Watch Paths (DEPLOY.md). Read as Coolify
// reads them: * stays within a folder, ** crosses folders, the last matching
// line wins and a "!" line excludes.
const lines = readFileSync(new URL('./deploy-watch-paths.txt', import.meta.url), 'utf8')
  .split('\n').map(line => line.trim()).filter(Boolean);

const pattern = (glob: string) => new RegExp(`^${glob
  .replace(/[.+^${}()|\\]/g, '\\$&')
  .replace(/\*\*\/?|\*|\?/g, wildcard => wildcard === '?' ? '[^/]' : wildcard === '*' ? '[^/]*' : '.*')}$`);

const deploys = (file: string) => lines.reduce<boolean | null>((included, line) => {
  const exclusion = line.startsWith('!');
  return pattern(exclusion ? line.slice(1) : line).test(file) ? !exclusion : included;
}, null) === true;

it('redeploys the cache for every file of the repository it is built from', async () => {
  // The bundle server/Dockerfile builds, without the packages it installs.
  const { metafile } = await build({
    entryPoints: ['server/scooter-cache.ts'], bundle: true, platform: 'node', format: 'esm',
    packages: 'external', write: false, metafile: true, logLevel: 'silent',
  });
  const files = Object.keys(metafile.inputs);
  expect(files).toContain('src/lib/scooterFeeds.ts');
  expect(files.filter(file => !deploys(file))).toEqual([]);
  for (const file of ['server/Dockerfile', 'server/package-lock.json', 'tsconfig.json']) expect(deploys(file), file).toBe(true);
});

it('leaves the cache running for the website and the tests', () => {
  for (const file of ['src/lib/landingCopy.ts', 'src/lib/i18n.tsx', 'src/app/(map)/layout.tsx', 'src/components/MapCredits.tsx',
    'public/share/en.png', 'server/collectFeed.test.ts', 'src/lib/scooterFeeds.test.ts', 'README.md']) {
    expect(deploys(file), file).toBe(false);
  }
});
