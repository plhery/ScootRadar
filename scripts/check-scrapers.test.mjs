import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('./check-scrapers.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', script, ...args],
  { encoding: 'utf8', timeout: 10_000 });

// Both answer before reading Prometheus or Cloudflare.
describe('the scraping check', () => {
  it('prints its usage on --help', () => {
    const { status, stdout } = run('--help');
    expect(status).toBe(0);
    expect(stdout).toMatch(/^Usage: node scripts\/check-scrapers\.mjs \[--date=YYYY-MM-DD\]/);
  });

  it('refuses an option it does not know, rather than checking another day', () => {
    for (const option of ['--date=yesterday', '--nope', 'json']) {
      const { status, stderr } = run(option);
      expect(status, option).toBe(2);
      expect(stderr, option).toContain(`Unknown option ${option}\nUsage:`);
    }
  });
});
