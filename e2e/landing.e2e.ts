import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The landing page, src/app/(site)/[[...locale]]/page.tsx: one page per
// language, English at the root, served by the same Worker as the map and under
// the same security policy.

/** Where each language is. */
const ADDRESS = { en: '/', de: '/de', fr: '/fr', it: '/it' };

const HEADLINES = {
  en: /^There are \d+ scooters around you\.$/,
  de: /^Um dich herum stehen \d+ E-Scooter\.$/,
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
    await page.goto(ADDRESS[locale as keyof typeof ADDRESS]);
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
  await page.goto('/');
  const languages = page.getByRole('group', { name: 'Language' });
  await expect(languages.getByRole('link')).toHaveText(['EN', 'DE', 'FR', 'IT']);
  await expect(languages.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'page');
  for (const [locale, address] of Object.entries(ADDRESS)) {
    await expect(languages.getByRole('link', { name: locale.toUpperCase() })).toHaveAttribute('href', address);
  }

  await languages.getByRole('link', { name: 'FR' }).click();
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADLINES.fr);
  await expect(page.getByRole('group', { name: 'Langue' }).getByRole('link', { name: 'FR' }))
    .toHaveAttribute('aria-current', 'page');
  await expect(page).toHaveTitle(/^Carte des trottinettes électriques en libre-service/);

  // And back to English, which is the root.
  await page.getByRole('group', { name: 'Langue' }).getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('the landing page tells a search engine where each language is', async ({ page }) => {
  await page.goto('/de');
  const site = 'https://scooters.plhery.com';
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${site}/de`);
  for (const [locale, address] of Object.entries({ ...ADDRESS, 'x-default': '/' })) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`))
      .toHaveAttribute('href', new RegExp(`^${site}${address === '/' ? '/?' : address}$`));
  }

  const listed = await (await page.request.get('/sitemap.xml')).text();
  for (const address of ['/', '/de', '/fr', '/it', '/map', '/privacy']) expect(listed).toContain(`<loc>${site}${address}</loc>`);
  expect(listed).not.toContain(`${site}/en`);
});

test('the landing page leads to the map, and to the map of a city', async ({ page }) => {
  await page.goto('/');
  for (const open of await page.getByRole('link', { name: 'Open the map' }).all()) {
    await expect(open).toHaveAttribute('href', '/map');
  }
  await expect(page.getByRole('link', { name: 'Open the map' })).toHaveCount(3);

  const cities = page.locator('#cities');
  await expect(cities.getByRole('heading', { level: 2 })).toHaveText(/^\d+ cities\.$/);
  await expect(cities.getByRole('link', { name: 'Zürich', exact: true })).toHaveAttribute('href', /^\/map\?origin=47\.\d+,8\.\d+$/);
  await expect(cities.getByRole('link', { name: 'Roma', exact: true })).toHaveAttribute('href', /^\/map\?origin=41\.\d+,12\.\d+$/);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');

  // The map is another document, with its own layout: the link loads it whole.
  await page.getByRole('link', { name: 'Open the map' }).first().click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.locator('.app-shell')).toBeVisible();
});

test('a link to the map from when it was at the root still opens the map', async ({ page, request }) => {
  // The Worker answers before any page is rendered, and keeps what the link carries.
  const moved = await request.get('/?origin=47.3769,8.5417&theme=dark', { maxRedirects: 0 });
  expect(moved.status()).toBe(308);
  expect(new URL(moved.headers().location).pathname + new URL(moved.headers().location).search)
    .toBe('/map?origin=47.3769,8.5417&theme=dark');

  await page.goto('/?theme=dark');
  await expect(page).toHaveURL(/\/map\?theme=dark$/);
  await expect(page.locator('.app-shell')).toHaveAttribute('data-theme', 'dark');

  // What the map does not read is no reason to leave the landing page.
  const kept = await request.get('/?utm_source=share', { maxRedirects: 0 });
  expect(kept.status()).toBe(200);
});

test('an app installed while the root was the map opens on the map', async ({ page }) => {
  // What tells an installed app from a visitor, on Android and on iOS.
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'standalone', { get: () => true });
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.locator('.app-shell')).toBeVisible();

  // The other languages never were the map.
  await page.goto('/de');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADLINES.de);
});

test('English has one address', async ({ request }) => {
  const second = await request.get('/en', { maxRedirects: 0 });
  expect(second.status()).toBe(308);
  expect(new URL(second.headers().location, 'http://site').pathname).toBe('/');
});

test('the landing page is accessible, and its targets are big enough for a finger', async ({ page }) => {
  // At rest: further down, a figure is dim until it has scrolled into view.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);

  for (const link of await page.locator('.pill a:visible, .btn, .footer a').all()) {
    const box = (await link.boundingBox())!;
    expect(box.height, await link.innerText()).toBeGreaterThanOrEqual(38);
  }
});

/** What the scroll moves, as it is drawn now. */
const drawn = (page: Page) => page.evaluate(() => {
  const style = (selector: string, pseudo?: string) => getComputedStyle(document.querySelector(selector)!, pseudo);
  const offset = (value: string) => (value === 'none' ? 0 : parseFloat(value));
  return {
    // How far the battery filter has slid from "any", in its own widths.
    thumb: style('.segments', '::before').translate,
    stepLit: style('.segments .is-on').backgroundColor,
    title: style('.know .title').backgroundPositionX,
    titleInk: style('.know .title').webkitTextFillColor,
    lastWords: style('.closing .display').backgroundPositionX,
    cells: [...document.querySelectorAll('.cell')].map(cell => getComputedStyle(cell).opacity),
    tiles: [...document.querySelectorAll('.tiles li')].map(tile => getComputedStyle(tile).opacity),
    phones: [...document.querySelectorAll('.cell-shot .phone, .cities-phone')].map(phone => offset(getComputedStyle(phone).translate.split(' ')[1] ?? 'none')),
    figures: [...document.querySelectorAll('.cell .figure')].map(figure => getComputedStyle(figure).opacity),
    bar: style('.pill').backgroundColor,
  };
});

test('what follows the scroll starts unlit and ends as the page is at rest', async ({ page }) => {
  await page.goto('/');
  test.skip(!(await page.evaluate(() => CSS.supports('animation-timeline: view()'))), 'this browser has no scroll timelines');

  // At the top nothing further down has happened yet.
  const before = await drawn(page);
  expect(before.thumb).toBe('0%');
  expect(before.title).toBe('100%');
  expect(before.tiles).toEqual(Array(7).fill('0'));
  expect(Number(before.figures[0])).toBeLessThan(0.3);

  // Each has its own stretch of the page. All of it is over at the bottom, the
  // last words included, which have the least page left under them.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(async () => (await drawn(page)).lastWords).toBe('0%');
  const after = await drawn(page);
  // Two steps on, and the two gaps between them: "60%+".
  expect(after.thumb).toBe('calc(200% + 8px)');
  expect(after.title).toBe('0%');
  expect(after.cells).toEqual(after.cells.map(() => '1'));
  expect(after.tiles).toEqual(Array(7).fill('1'));
  expect(after.phones).toEqual(after.phones.map(() => 0));
  expect(after.figures).toEqual(after.figures.map(() => '1'));
  if (page.viewportSize()!.width >= 760) {
    // The bar is glass once the page has moved under it.
    const clear = /[/,] 0\)$/;
    expect(before.bar).toMatch(clear);
    expect(after.bar).not.toMatch(clear);
  }
});

test('without motion the landing page is at rest from the start', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const still = await drawn(page);
  // The filter is drawn set, by the step itself; the titles are lit; nothing waits for the scroll.
  expect(still.stepLit).toBe('rgb(244, 245, 247)');
  expect(still.titleInk).toBe('rgb(244, 245, 247)');
  expect(still.cells).toEqual(still.cells.map(() => '1'));
  expect(still.tiles).toEqual(Array(7).fill('1'));
  expect(still.figures).toEqual(still.figures.map(() => '1'));
  expect(still.phones).toEqual(still.phones.map(() => 0));
});

test('the landing page has no page for a language it does not speak', async ({ page }) => {
  expect((await page.goto('/es'))?.status()).toBe(404);
  expect((await page.goto('/de/zurich'))?.status()).toBe(404);
  expect((await page.goto('/en/zurich'))?.status()).toBe(404);
});

test.describe('before any script runs', () => {
  test.use({ javaScriptEnabled: false });

  test('the landing page is already whole', async ({ page }) => {
    await page.goto('/de');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(HEADLINES.de);
    await expect(page.locator('.near-card')).toHaveCount(7);
    await expect(page.locator('.stage-phone img')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Karte öffnen' }).first()).toHaveAttribute('href', '/map');
  });
});
