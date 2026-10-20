import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { cacheDeployment, inNightBanHours } from './deploy-after-ci.mjs';

// 14:00 in Paris on 20 October 2026 (summer time, UTC+2).
const afternoon = new Date('2026-10-20T12:00:00Z');

describe('the cache deploy after CI', () => {
  it('deploys a change to a file of the cache, and only that', () => {
    expect(cacheDeployment({ files: ['README.md', 'server/collectFeed.ts', 'src/lib/landingCopy.ts'], messages: ['Collect'], now: afternoon }))
      .toEqual({ deploy: true, changed: ['server/collectFeed.ts'] });
    expect(cacheDeployment({ files: ['src/app/page.tsx', 'server/collectFeed.test.ts'], messages: ['Copy'], now: afternoon }))
      .toEqual({ deploy: false, reason: 'no file of the cache changed' });
  });

  it('leaves the cache alone when every commit says [skip cd], until one that does not', () => {
    const files = ['data/providers.json'];
    expect(cacheDeployment({ files, messages: ['Add a feed [skip cd]', 'Fix it [SKIP CI]'], now: afternoon }).deploy).toBe(false);
    expect(cacheDeployment({ files, messages: ['Add a feed [skip cd]', 'Fix the copy'], now: afternoon }).deploy).toBe(true);
  });

  it('holds the cache back from 23:00 to 05:30 in Paris', () => {
    const at = (/** @type {string} */ utc) => cacheDeployment({ files: ['server/scooter-cache.ts'], messages: ['Change'], now: new Date(utc) }).deploy;
    // Summer time: Paris is UTC+2 until 25 October 2026.
    expect(at('2026-10-20T20:59:00Z')).toBe(true);
    expect(at('2026-10-20T21:00:00Z')).toBe(false);
    expect(at('2026-10-21T03:29:00Z')).toBe(false);
    expect(at('2026-10-21T03:30:00Z')).toBe(true);
    // Winter time: UTC+1.
    expect(inNightBanHours(new Date('2026-12-01T21:59:00Z'))).toBe(false);
    expect(inNightBanHours(new Date('2026-12-01T22:00:00Z'))).toBe(true);
    expect(inNightBanHours(new Date('2026-12-02T04:29:00Z'))).toBe(true);
    expect(inNightBanHours(new Date('2026-12-02T04:30:00Z'))).toBe(false);
  });
});

describe('the branches CI moves', () => {
  // A remote with main, production and production-cache at a first commit, and a clone of it.
  function repository() {
    const root = mkdtempSync(path.join(tmpdir(), 'deploy-after-ci-'));
    const remote = path.join(root, 'remote.git');
    const clone = path.join(root, 'clone');
    const git = (/** @type {string[]} */ ...args) => execFileSync('git', args, { cwd: clone, encoding: 'utf8' }).trim();
    execFileSync('git', ['init', '--quiet', '--bare', '--initial-branch=main', remote]);
    execFileSync('git', ['clone', '--quiet', remote, clone], { stdio: 'ignore' });
    git('config', 'user.name', 'CI');
    git('config', 'user.email', 'ci@example.com');
    const commit = (/** @type {string} */ file, /** @type {string} */ message, branch = 'main') => {
      mkdirSync(path.dirname(path.join(clone, file)), { recursive: true });
      writeFileSync(path.join(clone, file), message);
      git('add', file);
      git('commit', '--quiet', '-m', message);
      git('push', '--quiet', '--force', 'origin', `HEAD:${branch}`);
      return git('rev-parse', 'HEAD');
    };
    const first = commit('README.md', 'First');
    git('push', '--quiet', 'origin', 'HEAD:production', 'HEAD:production-cache');
    const deploy = (/** @type {string} */ at) => {
      git('fetch', '--quiet', 'origin');
      git('checkout', '--quiet', '--detach', at);
      return execFileSync('node', [script], { cwd: clone, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    };
    const tip = (/** @type {string} */ branch) => git('rev-parse', `origin/${branch}`);
    return { first, commit, deploy, tip, git, done: () => rmSync(root, { recursive: true, force: true }) };
  }
  const script = fileURLToPath(new URL('./deploy-after-ci.mjs', import.meta.url));

  it('moves production to every commit and production-cache to one that changes the cache', () => {
    const repo = repository();
    try {
      const website = repo.commit('src/app/page.tsx', 'Website');
      repo.deploy(website);
      expect([repo.tip('production'), repo.tip('production-cache')]).toEqual([website, repo.first]);
      const cache = repo.commit('server/collectFeed.ts', 'Cache');
      const later = repo.commit('README.md', 'Docs');
      repo.deploy(later);
      expect(repo.tip('production')).toBe(later);
      expect(repo.tip('production-cache')).toBe(inNightBanHours(new Date()) ? repo.first : later);
      // A commit whose CI ends after a later one's moves nothing back.
      repo.deploy(cache);
      expect(repo.tip('production')).toBe(later);
    } finally {
      repo.done();
    }
  });

  it('fails without moving a branch that is not behind the commit', () => {
    const repo = repository();
    try {
      repo.git('checkout', '--quiet', '--detach', repo.first);
      const elsewhere = repo.commit('server/collectFeed.ts', 'Elsewhere', 'production');
      repo.git('checkout', '--quiet', 'main');
      const website = repo.commit('src/app/page.tsx', 'Website');
      expect(() => repo.deploy(website)).toThrow(/production \(\w+\) is not an ancestor/);
      expect(repo.tip('production')).toBe(elsewhere);
    } finally {
      repo.done();
    }
  });
});
