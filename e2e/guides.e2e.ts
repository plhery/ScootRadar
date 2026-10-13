import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// The guides, src/app/(site)/guides.tsx: one page each in the language it is
// written in, and a list of them in each language that has some. They are
// served by the same Worker as the landing page, under the same layout.

const SITE = 'https://scootradar.com';

/** The guide on the rules in Switzerland, in each language it is written in. */
const SWISS_RULES = {
  en: '/guides/e-scooter-rules-switzerland',
  de: '/de/ratgeber/e-trottinett-regeln-schweiz',
  fr: '/fr/guides/trottinette-electrique-regles-suisse',
  it: '/it/guide/monopattino-elettrico-regole-svizzera',
};

/** Where each language lists its guides. */
const LISTS = {
  en: '/guides', de: '/de/ratgeber', fr: '/fr/guides', it: '/it/guide', nl: '/nl/gidsen', nb: '/nb/guider',
  pt: '/pt/guias', es: '/es/guias', is: '/is/leidarvisar',
};

// On every page of the site Chromium refuses the preload hint of the first
// script, which the Worker gives no nonce. The script itself loads by its tag.
const SCRIPT_PRELOAD = /^Loading the script '[^']+\/_next\/static\/chunks\/[^']+\.js' violates the following Content Security Policy directive: "script-src /;

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

for (const [locale, address] of Object.entries(SWISS_RULES)) {
  test(`a guide reads in ${locale}, from its trail to its sources`, async ({ page }) => {
    const heard = complaints(page);
    await page.goto(address);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    // The trail leads back to the landing page and to the guides of the language.
    const trail = page.locator('.trail');
    await expect(trail.getByRole('link')).toHaveCount(2);
    await expect(trail.getByRole('link').nth(1)).toHaveAttribute('href', LISTS[locale as keyof typeof LISTS]);

    // Each line of the contents leads to a section that is there.
    for (const link of await page.locator('.contents a').all()) {
      const target = (await link.getAttribute('href'))!;
      await expect(page.locator(target)).toHaveCount(1);
    }
    await expect(page.locator('.guide-section').first()).toBeVisible();
    await expect(page.locator('.guide-sources li').first()).toBeVisible();

    expect(await overflow(page)).toBe(0);
    expect(heard).toEqual([]);
  });
}

test('a guide tells a search engine where it is in the other languages, and what it answers', async ({ page }) => {
  await page.goto(SWISS_RULES.fr);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${SWISS_RULES.fr}`);
  for (const [locale, address] of Object.entries({ ...SWISS_RULES, 'x-default': SWISS_RULES.en })) {
    await expect(page.locator(`link[rel="alternate"][hreflang="${locale}"]`)).toHaveAttribute('href', `${SITE}${address}`);
  }
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `${SITE}/share/fr.png`);

  const described = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() ?? '');
  const types = described['@graph'].map((entity: { '@type': string }) => entity['@type']);
  expect(types).toEqual(['Organization', 'Article', 'BreadcrumbList', 'FAQPage']);
  const asked = described['@graph'][3].mainEntity.map((question: { name: string }) => question.name);
  await expect(page.locator('.guide-faq dt')).toHaveText(asked);

  // The bar changes language to the same guide.
  const languages = page.getByRole('group', { name: 'Langue' });
  await expect(languages.getByRole('link')).toHaveText(['EN', 'DE', 'FR', 'IT']);
  await languages.getByRole('link', { name: 'DE' }).click();
  await expect(page).toHaveURL(new RegExp(`${SWISS_RULES.de}$`));
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('a guide on a city opens the map there', async ({ page }) => {
  await page.goto('/guides/e-scooters-zurich');
  const open = page.locator('.guide-map').getByRole('link', { name: 'Open the map' });
  await expect(open).toHaveAttribute('href', /^\/map\?origin=47\.\d+,8\.\d+$/);
  // The map reads the place and may then tidy its address.
  await open.click();
  await expect(page).toHaveURL(/\/map(\?|$)/);
  await expect(page.locator('.app-shell')).toBeVisible();
});

test('each language that has guides lists them, and its footer too', async ({ page }) => {
  for (const [locale, address] of Object.entries(LISTS)) {
    await page.goto(address);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    const listed = await page.locator('main .guide-list a').all();
    expect(listed.length).toBeGreaterThan(0);
    for (const guide of listed) {
      await expect(guide).toHaveAttribute('href', new RegExp(`^${address}/[a-z0-9-]+$`));
    }

    // The footer of the landing page names the same guides, and the list of them last.
    await page.goto(locale === 'en' ? '/' : `/${locale}`);
    const footer = page.getByRole('contentinfo').locator('.guides a');
    await expect(footer.last()).toHaveAttribute('href', address);
    await expect(footer).toHaveCount(listed.length + 1);
  }
});

test('there is no guide where none is written', async ({ request }) => {
  for (const address of ['/en/guides', '/de/guides', '/guides/nowhere', '/fr/guides/e-scooters-zurich']) {
    expect((await request.get(address)).status(), address).toBe(404);
  }
});

test('the guides are in the sitemap, each with its translations', async ({ request }) => {
  const listed = await (await request.get('/sitemap.xml')).text();
  for (const address of [...Object.values(LISTS), ...Object.values(SWISS_RULES)]) {
    expect(listed).toContain(`<loc>${SITE}${address}</loc>`);
  }
  expect(listed).toContain(`hreflang="it" href="${SITE}${SWISS_RULES.it}"`);
});

test('a guide follows the appearance of the system, where the landing page stays at night', async ({ page }) => {
  const painted = () => page.evaluate(() => ({
    page: getComputedStyle(document.body).backgroundColor,
    // The colour the browser gives what it draws around the page.
    around: [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')]
      .find(meta => !meta.media || matchMedia(meta.media).matches)?.content,
  }));
  const day = { page: 'rgb(244, 245, 247)', around: '#f4f5f7' };
  const night = { page: 'rgb(9, 11, 16)', around: '#090b10' };

  for (const address of [SWISS_RULES.en, LISTS.en]) {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(address);
    expect(await painted(), address).toEqual(day);
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await painted(), address).toEqual(night);
  }

  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  expect(await painted()).toEqual(night);
});

test('a guide is accessible in either appearance, and its targets are big enough for a finger', async ({ page }) => {
  // Each appearance from the load: the cards would still be on their way from the other one.
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme });
    for (const address of [SWISS_RULES.en, LISTS.en]) {
      await page.goto(address);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(accessibility.violations, `${address}, ${colorScheme}`).toEqual([]);

      for (const link of await page.locator('.pill a:visible, .trail a, .contents a, .btn, .guide-list a, .footer a').all()) {
        const box = (await link.boundingBox())!;
        expect(box.height, await link.innerText()).toBeGreaterThanOrEqual(38);
      }
    }
  }
});
