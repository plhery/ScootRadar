import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./check-french-feeds.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', timeout: 10_000 });

// Both answer before the first request, so neither reads a feed.
describe('the live catalog check', () => {
  it('prints its usage on --help', () => {
    const { status, stdout } = run('--help');
    expect(status).toBe(0);
    expect(stdout).toMatch(/^Usage: node scripts\/check-french-feeds\.mjs .*--fail-on=any\|gone/);
    expect(stdout).toContain('north-america');
  });

  it('refuses an option it does not know, instead of running the whole check without it', () => {
    for (const option of ['--nope', 'json', '--country=FR']) {
      const { status, stderr } = run('--countries=FR', option);
      expect(status, option).toBe(2);
      expect(stderr, option).toContain(`Unknown option ${option}\nUsage:`);
    }
  });
});
