import { build } from 'esbuild';
import { expect, it } from 'vitest';
import { cacheDeploys as deploys } from '../scripts/deploy-watch-paths.mjs';

// CI's deploy job redeploys the cache when a commit that passed changes a file
// server/deploy-watch-paths.txt matches (DEPLOY.md).

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
