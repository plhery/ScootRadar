import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The landing page, src/app/(site)/[locale]/page.tsx: one page per language
// beside the app, served by the same Worker under the same security policy.

const HEADLINES = {
  en: /^There are \d+ scooters around you\.$/,
  de: /^Um dich herum stehen \d+ Scooter\.$/,
  fr: /^Il y a \d+ trottinettes autour de vous\.$/,
  it: /^Ci sono \d+ monopattini intorno a te\.$/,
};

// On every page of the site Chromium refuses the preload hint of the first
// script, which the Worker gives no nonce. The script itself loads by its tag.
const SCRIPT_PRELOAD = /^Loading the script '[^']+\/_next\/static\/chunks\/[^']+\.js' violates the following Content Security Policy directive: "script-src /;

/** What the browser refused or threw while the page was open. */
function complaints(page: Page): string[] {
  const heard: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error' && !SCRIPT_PRELOAD.test(message.text())) heard.push(message.text());
  });
  page.on('pageerror', error => heard.push(String(error)));
  return heard;
}

const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

for (const [locale, headline] of Object.entries(HEADLINES)) {
  test(`the landing page reads in ${locale}, with its pictures and its fonts`, async ({ page }) => {
    const heard = complaints(page);
    await page.goto(`/${locale}`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline);

    // Seven providers beside the phone, the nearest first.
    const cards = page.locator('.near-card');
    await expect(cards).toHaveCount(7);
    await expect(cards.first()).toContainText('Voi');
    await expect(cards.first()).toContainText('60 m');

    // The pictures further down load as they come into view.
    const pictures = page.locator('main img');
    await expect(pictures).toHaveCount(5);
    for (const picture of await pictures.all()) {
      await picture.scrollIntoViewIfNeeded();
      await expect.poll(() => picture.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth)).toBe(780);
      await expect(picture).toHaveAttribute('src', new RegExp(`^/landing/${locale}-`));
      expect(await picture.getAttribute('alt')).not.toBe('');
    }

    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('800 40px "Red Hat Display"'))).toBe(true);
    expect(await overflow(page)).toBe(0);
    expect(heard).toEqual([]);
  });
}

test('the landing page changes language from its bar and stays where it is', async ({ page }) => {
  await page.goto('/en');
  const languages = page.getByRole('group', { name: 'Language' });
  await expect(languages.getByRole('link')).toHaveText(['EN', 'DE', 'FR', 'IT']);
  await expect(languages.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'page');

  await languages.getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADLINES.fr);
  await expect(page.getByRole('group', { name: 'Langue' }).getByRole('link', { name: 'FR' }))
    .toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveTitle(/^Scooters — Les trottinettes/);
});

test('the landing page leads to the map, and to the map of a city', async ({ page }) => {
  await page.goto('/en');
  for (const open of await page.getByRole('link', { name: 'Open the map' }).all()) {
    await expect(open).toHaveAttribute('href', '/');
  }
  await expect(page.getByRole('link', { name: 'Open the map' })).toHaveCount(3);

  const cities = page.locator('#cities');
  await expect(cities.getByRole('heading', { level: 2 })).toHaveText(/^\d+ cities\.$/);
  await expect(cities.getByRole('link', { name: 'Zürich', exact: true })).toHaveAttribute('href', /^\/\?origin=47\.\d+,8\.\d+$/);
  await expect(cities.getByRole('link', { name: 'Roma', exact: true })).toHaveAttribute('href', /^\/\?origin=41\.\d+,12\.\d+$/);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
});

test('the landing page is accessible, and its targets are big enough for a finger', async ({ page }) => {
  // At rest: further down, a figure is dim until it has scrolled into view.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);

  for (const link of await page.locator('.pill a:visible, .btn, .footer a').all()) {
    const box = (await link.boundingBox())!;
    expect(box.height, await link.innerText()).toBeGreaterThanOrEqual(38);
  }
});

test('the landing page has no page for a language it does not speak', async ({ page }) => {
  expect((await page.goto('/es'))?.status()).toBe(404);
  expect((await page.goto('/en/zurich'))?.status()).toBe(404);
});

test.describe('before any script runs', () => {
  test.use({ javaScriptEnabled: false });

  test('the landing page is already whole', async ({ page }) => {
    await page.goto('/de');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADLINES.de);
    await expect(page.locator('.near-card')).toHaveCount(7);
    await expect(page.locator('.stage-phone img')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Karte öffnen' }).first()).toHaveAttribute('href', '/');
  });
});
