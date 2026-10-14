import type { Page } from '@playwright/test';

/**
 * The visitor of these tests is in Switzerland, where the fixtures are:
 * playwright.config.ts asks for en-CH, so numbers, times and distances are
 * written as en-CH writes them. WebKit knows no English but the US's and the
 * UK's and turns en-CH into en-GB, which would write distances in miles; this
 * gives it back the region it was asked for. A test of another region sets its
 * own locale, which this leaves alone.
 */
export async function visitFromSwitzerland(page: Page) {
  await page.addInitScript(() => {
    if (navigator.languages.join() !== 'en-GB') return;
    Object.defineProperty(Navigator.prototype, 'languages', { configurable: true, get: () => ['en-CH'] });
    Object.defineProperty(Navigator.prototype, 'language', { configurable: true, get: () => 'en-CH' });
  });
}
