// F-Droid's build of the Android app (the fdroid flavor) runs the website's generators, as every build does
// (android/core/build.gradle.kts), with Debian's node and none of the repository's npm packages but the one
// they import without esbuild: tldts, for the rental links' check (scripts/rental-links.mjs). The catalog's
// generator then reads scripts/lime-grid.generated.mjs in esbuild's place. This installs tldts and what it
// needs alone, at the versions and with the integrity the repository's package-lock.json gives them, with
// npm ci and no install scripts, into node_modules at the top of a checkout that has none.
//
// Usage, from the top of the repository: node android/fdroid/install-node-packages.mjs
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGES = ['tldts'];

const root = fileURLToPath(new URL('../..', import.meta.url));
const target = join(root, 'node_modules');
if (existsSync(target)) throw new Error(`${target} exists already: this is for a checkout without the repository's npm packages`);

// The packages and those they depend on, as package-lock.json has them, with nothing marked as for development.
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const packages = {};
const pending = [...PACKAGES];
while (pending.length) {
  const name = pending.shift();
  const key = `node_modules/${name}`;
  if (key in packages) continue;
  const entry = lock.packages[key];
  if (!entry?.version || !entry.resolved || !entry.integrity) throw new Error(`package-lock.json has no ${name} to install`);
  if (Object.keys(lock.packages).some(other => other.startsWith(`${key}/node_modules/`))) {
    throw new Error(`package-lock.json nests packages under ${name}, which this doesn't install`);
  }
  packages[key] = Object.fromEntries(Object.entries(entry).filter(([field]) => field !== 'dev' && field !== 'devOptional'));
  pending.push(...Object.keys(entry.dependencies ?? {}));
}

const name = 'scootradar-android-generators';
const dependencies = Object.fromEntries(PACKAGES.map(name => [name, packages[`node_modules/${name}`].version]));
const directory = mkdtempSync(join(tmpdir(), `${name}-`));
try {
  writeFileSync(join(directory, 'package.json'), `${JSON.stringify({ name, private: true, dependencies }, null, 2)}\n`);
  writeFileSync(join(directory, 'package-lock.json'), `${JSON.stringify({
    name, lockfileVersion: 3, requires: true, packages: { '': { name, dependencies }, ...packages },
  }, null, 2)}\n`);
  const npm = spawnSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: directory, stdio: 'inherit' });
  if (npm.error) throw npm.error;
  if (npm.status !== 0) throw new Error(`npm ci failed (${npm.status ?? npm.signal})`);
  try {
    renameSync(join(directory, 'node_modules'), target);
  } catch (error) {
    // Another file system than the checkout's.
    if (error.code !== 'EXDEV') throw error;
    cpSync(join(directory, 'node_modules'), target, { recursive: true });
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
console.log(`Installed ${Object.keys(packages).map(key => `${key.slice('node_modules/'.length)}@${packages[key].version}`).join(', ')}`);
