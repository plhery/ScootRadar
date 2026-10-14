import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { visitFromSwitzerland } from './swissVisitor';

// Directions on the card of a scooter or a parking bay, src/components/WalkAction.tsx:
// the walk is drawn on the map (src/lib/walkRouteLayer.ts) along the way that
// /api/walk finds. That route asks FOSSGIS Valhalla: here it is always stood in
// for, and every way is made up.

// WebKit routes service-worker-controlled fetches outside Playwright's request
// mocking; the walk must never reach the server, which would ask Valhalla.
test.use({ serviceWorkers: 'block' });

type Point = [number, number];
type Box = { x: number; y: number; width: number; height: number };

/** A wide window with a mouse: the card of a scooter or bay opens beside its marker, and the providers are a legend. */
const desktopLayout = (page: Page) => page.evaluate(() => matchMedia('(min-width: 900px) and (pointer: fine)').matches);
/** What holds the card of the selected scooter or bay: the dock on a phone, the popover on a desktop. */
const cardSurface = async (page: Page) => await desktopLayout(page) ? '.marker-popover' : '.sheet';
const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const centre = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

/** The same great-circle distance as src/lib/geo.ts, so that the figures expected are the ones the card works out. */
function haversineM([lat1, lng1]: Point, [lat2, lng2]: Point): number {
  const rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lng2 - lng1) * rad) / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(a));
}
const lengthOf = (line: Point[]) => line.slice(1).reduce((sum, point, index) => sum + haversineM(line[index], point), 0);
/** Minutes on foot as the card counts them: 80 m a minute, at least one. */
const minutesFor = (metres: number) => Math.max(1, Math.ceil(metres / 80));

async function zoomTo(page: Page, target: number) {
  const map = page.locator('.leaflet-container');
  // Touch screens have no zoom buttons; there the keyboard stands in for a pinch.
  const buttons = await page.locator('.map-zoom-controls').isVisible();
  let current = Number(await map.getAttribute('data-zoom'));
  while (current !== target) {
    const zoomIn = current < target;
    const next = current + (zoomIn ? 1 : -1);
    if (buttons) {
      await page.locator('.map-zoom-controls').getByRole('button', {
        name: zoomIn ? 'Zoom in' : 'Zoom out',
        exact: true,
      }).click();
    } else {
      await map.press(zoomIn ? 'Equal' : 'Minus');
    }
    await expect(map).toHaveAttribute('data-zoom', String(next));
    current = next;
  }
}

/** Where the fixture scooters stand: Lime on the spot, Bird and Bolt within two metres of it. */
const LIME: Point = [47.3769, 8.5417];
/** Where you are: some 130 m south of them, along the same street. */
const HERE: Point = [47.3757, 8.5417];
/** The way found: west along one street, north along the next, and east again to the scooters. */
const WAY: Point[] = [[47.3757, 8.5416], [47.3757, 8.5404], [47.3769, 8.5404], [47.3769, 8.5416]];
/** The walk the card measures: from where you are, along the way, to the scooter. */
const WALK_M = lengthOf([HERE, ...WAY, LIME]);
const STRAIGHT_M = haversineM(HERE, LIME);

const scooterResponse = {
  vehicles: [
    {
      provider: 'lime',
      lat: LIME[0],
      lng: LIME[1],
      battery: 82,
      range_m: 14_000,
      vehicle_id: 'lime-1',
      deep_link: null,
      rental_uris: { ios: 'https://li.me/ride', android: 'https://li.me/ride', web: 'https://li.me/ride' },
      pricing: { currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 35 },
      distance_m: 8,
    },
    { provider: 'bird', lat: 47.37691, lng: 8.54171, battery: 64, range_m: 10_000, vehicle_id: 'bird-1', deep_link: null, distance_m: 9 },
    { provider: 'bolt', lat: 47.37692, lng: 8.54172, battery: 58, range_m: 9_000, vehicle_id: 'bolt-1', deep_link: null, distance_m: 10 },
  ],
  clusters: [],
  providers: { lime: 1, bird: 1, bolt: 1 },
  meta: {
    partial: false,
    stale: false,
    failedSources: [],
    sources: { national: 'fresh', hopp: 'fresh' },
    generatedAt: new Date().toISOString(),
    truncated: false,
    totalVehicles: 3,
    mode: 'vehicles',
    zoom: 17,
  },
};

/** Where the browser says you are, from the first moment; null refuses location. */
async function locateAt(page: Page, at: Point | null) {
  await page.addInitScript(at => {
    const denied = { code: 1, message: 'Permission denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
    const position = at && {
      coords: { latitude: at[0], longitude: at[1], accuracy: 5,
        altitude: null, altitudeAccuracy: null, heading: null, speed: 0, toJSON: () => ({}) },
      timestamp: Date.now(), toJSON: () => ({}),
    };
    const answer = (success: PositionCallback, error?: PositionErrorCallback | null) =>
      queueMicrotask(() => position ? success(position as GeolocationPosition) : error?.(denied as GeolocationPositionError));
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: answer,
        watchPosition: (success: PositionCallback, error?: PositionErrorCallback | null) => { answer(success, error); return 1; },
        clearWatch: () => {},
      },
    });
  }, at);
}

/**
 * Stands in for /api/walk with one answer. Records what each request asks;
 * a held answer waits for `release`, so that what shows while the way is found can be seen.
 */
async function answerWalks(page: Page, answer: { status?: number; body: object }, { held = false } = {}) {
  const asked: { method: string; body: unknown }[] = [];
  let release = () => {};
  const gate = held ? new Promise<void>(resolve => { release = resolve; }) : Promise.resolve();
  await page.route('**/api/walk', async route => {
    asked.push({ method: route.request().method(), body: route.request().postDataJSON() });
    await gate;
    // The walk may have been put away meanwhile, and its request cancelled.
    await route.fulfill({ status: answer.status ?? 200, contentType: 'application/json', body: JSON.stringify(answer.body) })
      .catch(() => {});
  });
  return { asked, release: () => release() };
}

/**
 * Follows the dotted line in the map's overlay pane: its length in pixels each
 * time it is drawn, at which zoom, and whether it faded before it was taken away.
 */
async function watchRoute(page: Page) {
  await page.locator('.leaflet-overlay-pane').evaluate(pane => {
    const log = { drawn: [] as { length: number; zoom: string }[], faded: false };
    (window as unknown as { routeLog: typeof log }).routeLog = log;
    new MutationObserver(() => {
      const dots = pane.querySelector<SVGPathElement>('path.walk-route-dots');
      if (!dots) return;
      if (dots.classList.contains('walk-route-leaving')) log.faded = true;
      const length = dots.getTotalLength();
      if (length > 0 && length !== log.drawn.at(-1)?.length) {
        log.drawn.push({ length, zoom: document.querySelector<HTMLElement>('.leaflet-container')!.dataset.zoom! });
      }
    }).observe(pane, { subtree: true, childList: true, attributes: true, attributeFilter: ['d', 'class'] });
  });
}
const routeLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { routeLog: { drawn: { length: number; zoom: string }[]; faded: boolean } }).routeLog);

/** The two ends of the dotted line on the screen, in the page's pixels. */
const routeEnds = (page: Page) => page.locator('path.walk-route-dots').evaluate((path: SVGPathElement) => {
  const matrix = path.getScreenCTM()!;
  const at = (length: number) => {
    const point = new DOMPoint(path.getPointAtLength(length).x, path.getPointAtLength(length).y).matrixTransform(matrix);
    return { x: point.x, y: point.y };
  };
  return { start: at(0), end: at(path.getTotalLength()) };
});

/**
 * Where the line is drawn, and what of the map is left for it: under the search
 * bar, and above the dock on a phone or right of it on a desktop.
 */
const routeInFrame = (page: Page) => page.evaluate(() => {
  const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
  const [route, map, bar, sheet] = [box('path.walk-route-dots'), box('.leaflet-container'), box('.search-island'), box('.sheet')];
  const beside = sheet.width < map.width / 2;
  const frame = {
    left: beside ? sheet.right : map.left,
    top: bar.bottom,
    right: map.right,
    bottom: beside ? map.bottom : sheet.top,
  };
  // The box of a path leaves its stroke out: a few pixels either way.
  return route.left >= frame.left - 4 && route.top >= frame.top - 4 &&
    route.right <= frame.right + 4 && route.bottom <= frame.bottom + 4 &&
    route.width + route.height > 40;
});

/** A spot of the map with nothing on it, well away from every marker and from what lies over the map. */
const emptySpot = (page: Page) => page.locator('.leaflet-container').evaluate(container => {
  const area = container.getBoundingClientRect();
  const markers = [...document.querySelectorAll('.leaflet-marker-icon')].map(marker => marker.getBoundingClientRect());
  for (let y = area.top + area.height * 0.2; y < area.bottom - 40; y += 20) {
    for (let x = area.left + 40; x < area.right - 40; x += 20) {
      const hit = document.elementFromPoint(x, y);
      if (!hit || !container.contains(hit) || hit.closest('.leaflet-marker-pane, .leaflet-control-container, button, a')) continue;
      if (markers.some(box => Math.hypot(x - (box.x + box.width / 2), y - (box.y + box.height / 2)) < 90)) continue;
      return { x: Math.round(x - area.left), y: Math.round(y - area.top) };
    }
  }
  throw new Error('No empty spot on the map');
});

/** Drags the map from an empty spot, and holds it still before letting go so that it does not glide on. */
async function dragMap(page: Page, down: number) {
  const area = (await page.locator('.leaflet-container').boundingBox())!;
  const from = await emptySpot(page);
  await page.mouse.move(area.x + from.x, area.y + from.y);
  await page.mouse.down();
  await page.mouse.move(area.x + from.x, area.y + from.y + down, { steps: 12 });
  await page.waitForTimeout(250);
  await page.mouse.up();
}

/** Drags the map until Lime's marker is off the screen. */
async function moveOutOfView(page: Page) {
  const marker = page.getByRole('button', { name: /^Lime scooter/ });
  // Without waiting for it: once out of view, a scooter no longer walked to leaves the map.
  const onScreen = () => marker.evaluateAll(elements => elements.some(element => {
    const box = element.getBoundingClientRect();
    return box.right > 0 && box.left < innerWidth && box.bottom > 0 && box.top < innerHeight;
  }));
  for (let drag = 0; drag < 4 && await onScreen(); drag++) await dragMap(page, 300);
  expect(await onScreen()).toBe(false);
}

/** Shows Lime alone and opens its card from the dock's lead, the nearest scooter. */
async function openLime(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Lime, 1. Shown.', exact: true }).click();
  await page.locator('.dock-lead').click();
  // The dock may hold a card of its own beside the popover of a desktop.
  const card = page.locator('.dock-card.scooter-card');
  await expect(card.getByRole('heading', { name: 'Lime' })).toBeVisible();
  return card;
}

test.beforeEach(async ({ page }) => {
  await visitFromSwitzerland(page);
  // Nothing reaches the routing service: a walk not stood in for by the test fails at once.
  await page.route('**/api/walk', route => route.fulfill({
    status: 502, contentType: 'application/json', body: JSON.stringify({ reason: 'failed' }),
  }));

  // The ground of the map: its address from here, and tiles with nothing but the land on them.
  await page.route('https://tiles.openfreemap.org/planet', route => route.fulfill({
    contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ tiles: ['https://tiles.openfreemap.org/planet/e2e/{z}/{x}/{y}.pbf'] }),
  }));
  await page.route('https://tiles.openfreemap.org/planet/e2e/**', route => route.fulfill({
    contentType: 'application/x-protobuf',
    headers: { 'access-control-allow-origin': '*' },
    body: '',
  }));

  await page.route('**/api/scooters?**', async route => {
    const zoom = Number(new URL(route.request().url()).searchParams.get('zoom'));
    const response = zoom <= 15
      ? {
          ...scooterResponse,
          vehicles: [],
          clusters: [{ id: '15:1:1', lat: 47.37691, lng: 8.54171, count: 3, providers: { lime: 1, bird: 1, bolt: 1 } }],
          meta: { ...scooterResponse.meta, mode: 'clusters', zoom },
        }
      : { ...scooterResponse, meta: { ...scooterResponse.meta, mode: 'vehicles', zoom } };
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(response) });
  });
});

test('Directions draws the walk from where you are, a tap on the map keeps it, and Hide route takes it away', async ({ page }) => {
  await locateAt(page, HERE);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } }, { held: true });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Near me', exact: true }).click();
  await expect(page.locator('.user-location-marker')).toBeVisible();
  const card = await openLime(page);
  const desktop = await desktopLayout(page);
  if (desktop) await expect(page.getByRole('dialog', { name: 'Lime scooter' })).toBeVisible();

  // Before the way is known the card measures the straight line.
  const figures = card.locator('.card-figure strong');
  await expect(figures).toHaveText([`${minutesFor(STRAIGHT_M)}min`, `${Math.round(STRAIGHT_M)}m`, '4.50']);
  await expect(card.getByRole('link', { name: 'Directions' })).toHaveCount(0);
  const directions = card.getByRole('button', { name: 'Directions', exact: true });
  await expect(directions).toHaveAttribute('aria-busy', 'false');
  const status = card.getByRole('status');
  await expect(status).toHaveText('');

  await watchRoute(page);
  await directions.click();

  // While the way is found the button turns, and a screen reader hears why.
  await expect(directions).toHaveAttribute('aria-busy', 'true');
  await expect(directions.locator('.walk-action-spinner')).toBeVisible();
  await expect(status).toHaveText('Finding the way…');
  // Nothing is drawn until the way is known.
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  // One request, from where you are to the scooter, in the body of a POST.
  await expect.poll(() => walks.asked.length).toBe(1);
  expect(walks.asked[0]).toEqual({ method: 'POST', body: { from: HERE, to: LIME } });

  walks.release();
  const hide = card.getByRole('button', { name: 'Hide route', exact: true });
  await expect(hide).toBeVisible();
  await expect(hide).toHaveClass(/walk-action-shown/);
  await expect(hide).toHaveAttribute('aria-busy', 'false');
  await expect(directions).toHaveCount(0);
  // The way is on the map: a white casing under the blue dots.
  await expect(page.locator('path.walk-route')).toHaveCount(2);
  await expect(page.locator('path.walk-route-casing')).toBeVisible();
  await expect(page.locator('path.walk-route-dots')).toBeVisible();
  // The card now measures the way, not the straight line, and says so once to a screen reader.
  const minutes = minutesFor(WALK_M);
  await expect(status).toHaveText(`Route shown: ≈${minutes} min walk · ${Math.round(WALK_M)} m`);
  await expect(figures).toHaveText([`${minutes}min`, `${Math.round(WALK_M)}m`, '4.50']);
  await expect(card.getByText(`≈${minutes} min walk · ${Math.round(WALK_M)} m`, { exact: true })).toHaveCount(1);

  // Once drawn, the line reaches from your location to the scooter, in the part of the map left free for it.
  const reaches = async () => {
    const [line, you, lime] = await Promise.all([
      routeEnds(page),
      page.locator('.user-location-marker').boundingBox(),
      page.getByRole('button', { name: /^Lime scooter/ }).locator('.scooter-marker').boundingBox(),
    ]);
    const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < 12;
    return { fromYou: near(line.start, centre(you!)), toLime: near(line.end, centre(lime!)) };
  };
  await expect.poll(reaches).toEqual({ fromYou: true, toLime: true });
  await expect.poll(() => routeInFrame(page)).toBe(true);
  // The map moved first, then the line grew from its start: it is never drawn mid-flight.
  const { drawn } = await routeLog(page);
  expect(drawn.length).toBeGreaterThan(2);
  expect(drawn[0].length).toBeLessThan(drawn.at(-1)!.length * 0.9);
  expect(new Set(drawn.map(step => step.zoom)).size).toBe(1);

  if (desktop) {
    // On a desktop the card is still beside its marker, and leaves it in view.
    const dialog = page.getByRole('dialog', { name: 'Lime scooter' });
    await expect(dialog).toHaveAttribute('data-placed', 'true');
    await expect(dialog.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
    const marker = (await page.getByRole('button', { name: /^Lime scooter/ }).boundingBox())!;
    expect(overlap((await dialog.boundingBox())!, marker)).toBe(false);
  }
  const accessibility = await new AxeBuilder({ page }).include(await cardSurface(page)).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);

  // A stray tap on the map does not take the way away.
  const map = page.locator('.leaflet-container');
  await map.click({ position: await emptySpot(page) });
  await page.waitForTimeout(400);
  await expect(card.getByRole('heading', { name: 'Lime' })).toBeVisible();
  await expect(hide).toBeVisible();
  await expect(page.locator('path.walk-route')).toHaveCount(2);

  // Hide route fades the way out, then takes it off the map; the card stays.
  await hide.click();
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  expect((await routeLog(page)).faded).toBe(true);
  await expect(directions).toBeVisible();
  await expect(directions).toHaveAttribute('aria-busy', 'false');
  await expect(status).toHaveText('');
  await expect(figures).toHaveText([`${minutesFor(STRAIGHT_M)}min`, `${Math.round(STRAIGHT_M)}m`, '4.50']);
  expect(walks.asked).toHaveLength(1);

  // Without a walk the same tap closes the card.
  await map.click({ position: await emptySpot(page) });
  await expect(card).toHaveCount(0);
});

test('a walk ends with its card, and its scooter stays selected while the map is moved away from it', async ({ page }) => {
  await locateAt(page, HERE);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Near me', exact: true }).click();
  await expect(page.locator('.user-location-marker')).toBeVisible();
  const card = await openLime(page);
  await card.getByRole('button', { name: 'Directions', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
  await expect(page.locator('path.walk-route-dots')).toBeVisible();

  // The map dragged until the scooter is off the screen: the walk and its card stay.
  await moveOutOfView(page);
  // Longer than the dock takes to settle and the map to move.
  await page.waitForTimeout(600);
  await expect(card.getByRole('heading', { name: 'Lime' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
  await expect(page.locator('.scooter-marker-selected')).toHaveCount(1);
  await expect(page.locator('path.walk-route')).toHaveCount(2);
  expect(walks.asked).toHaveLength(1);

  // The card's close button ends the walk, and takes the way off the map.
  await card.getByRole('button', { name: 'Close scooter details' }).click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  await expect(page.locator('.scooter-marker-selected')).toHaveCount(0);
});

for (const { label, status, reason, message } of [
  { label: 'no walking route', status: 422, reason: 'no_route', message: 'Couldn’t find a walking route.' },
  { label: 'a busy routing service', status: 503, reason: 'busy', message: 'Walking routes can’t be loaded right now.' },
]) {
  test(`${label} says so and offers Google Maps instead`, async ({ page }) => {
    await locateAt(page, HERE);
    const walks = await answerWalks(page, { status, body: { error: 'Made up', reason } });
    await page.goto('/map');
    await page.getByRole('button', { name: 'Near me', exact: true }).click();
    const card = await openLime(page);
    await card.getByRole('button', { name: 'Directions', exact: true }).click();

    const said = card.getByRole('status');
    await expect(said).toHaveText(message);
    await expect(said.locator('.walk-status-warning')).toBeVisible();
    const maps = card.getByRole('link', { name: 'Open in Google Maps' });
    await expect(maps).toHaveAttribute('href', /destination=47\.3769%2C8\.5417&travelmode=walking$/);
    await expect(maps).toHaveAttribute('target', '_blank');
    await expect(card.getByRole('button', { name: /^(Directions|Hide route)$/ })).toHaveCount(0);
    await expect(page.locator('path.walk-route')).toHaveCount(0);
    expect(walks.asked).toHaveLength(1);
    // Nothing more is asked by itself.
    await page.waitForTimeout(500);
    expect(walks.asked).toHaveLength(1);
    const accessibility = await new AxeBuilder({ page }).include(await cardSurface(page)).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(accessibility.violations).toEqual([]);

    // The card closed and opened again: Directions tries again.
    await card.getByRole('button', { name: 'Close scooter details' }).click();
    await page.locator('.dock-lead').click();
    await expect(card.getByRole('button', { name: 'Directions', exact: true })).toBeVisible();
    await expect(card.getByRole('status')).toHaveText('');
  });
}

test('Directions without a location to start from says so and offers Google Maps', async ({ page }) => {
  await locateAt(page, null);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map?origin=47.3769,8.5417');
  await expect(page.locator('.scooter-marker')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lime, 1. Shown.', exact: true }).click();
  await page.getByRole('button', { name: 'Lime scooter', exact: true }).click();
  const card = page.locator('.dock-card');
  await expect(card.getByRole('button', { name: 'Turn on location to see walking time' })).toBeVisible();

  await card.getByRole('button', { name: 'Directions', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('Couldn’t find your location.');
  await expect(card.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', /travelmode=walking/);
  expect(walks.asked).toHaveLength(0);

  // A walk that failed does not hold the card: it closes as its scooter leaves the view.
  await moveOutOfView(page);
  await expect(page.locator('.dock-card.scooter-card')).toHaveCount(0);
});

test('Directions next to the scooter says you are there, without asking for a way', async ({ page }) => {
  await locateAt(page, LIME);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Near me', exact: true }).click();
  const card = await openLime(page);
  await card.getByRole('button', { name: 'Directions', exact: true }).click();
  await expect(card.getByRole('status')).toHaveText('You’re there.');
  await expect(card.locator('.walk-status-arrived')).toBeVisible();
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(walks.asked).toHaveLength(0);

  // Nor does a walk that got there: the card closes as its scooter leaves the view.
  await moveOutOfView(page);
  await expect(card).toHaveCount(0);
});

test('a scooter more than 10 km away keeps Directions as a link to Google Maps', async ({ page }) => {
  // Bern, some 95 km from the scooters in Zürich.
  await locateAt(page, [46.948, 7.4474]);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map?origin=47.3769,8.5417');
  await expect(page.locator('.scooter-marker')).toHaveCount(3);
  await page.getByRole('button', { name: 'Lime, 1. Shown.', exact: true }).click();
  await page.getByRole('button', { name: 'Lime scooter', exact: true }).click();
  const card = page.locator('.dock-card');
  // Located from the card: the map stays on the scooter.
  await card.getByRole('button', { name: 'Turn on location to see walking time' }).click();
  await expect(card.locator('.card-figure strong').nth(1)).toHaveText(/^9\d(\.\d)?km$/);

  const directions = card.getByRole('link', { name: 'Directions' });
  await expect(directions).toHaveAttribute('href', /destination=47\.3769%2C8\.5417&travelmode=walking$/);
  await expect(directions).toHaveAttribute('target', '_blank');
  await expect(card.getByRole('button', { name: 'Directions', exact: true })).toHaveCount(0);
  expect(walks.asked).toHaveLength(0);
});

test('where motion is reduced the way is drawn at once, and goes at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await locateAt(page, HERE);
  const walks = await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Near me', exact: true }).click();
  await expect(page.locator('.user-location-marker')).toBeVisible();
  const card = await openLime(page);
  await watchRoute(page);
  await card.getByRole('button', { name: 'Directions', exact: true }).click();

  await expect(page.locator('path.walk-route-dots')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
  await expect.poll(async () => routeInFrame(page)).toBe(true);
  // The first line drawn is the whole of it.
  const { drawn } = await routeLog(page);
  expect(drawn.length).toBeGreaterThan(0);
  expect(drawn[0].length).toBeCloseTo(drawn.at(-1)!.length, 0);
  expect(walks.asked).toHaveLength(1);

  await card.getByRole('button', { name: 'Hide route', exact: true }).click();
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  expect((await routeLog(page)).faded).toBe(false);
});

test('Directions on a parking bay is its blue button, and draws the walk once your location has come', async ({ page }) => {
  const BAY: Point = [45.75, 4.85];
  // Some 170 m south of the bay; located only once Directions is pressed.
  const there: Point = [45.7485, 4.85];
  const way: Point[] = [[45.7485, 4.8502], [45.7493, 4.8502], [45.7493, 4.8499], [45.75, 4.8499]];
  const walkM = lengthOf([there, ...way, BAY]);
  await page.route('**/api/scooters?**', async route => {
    const zoom = Number(new URL(route.request().url()).searchParams.get('zoom'));
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      ...scooterResponse, clusters: [], providers: { dott: 1 },
      // The scooter stands some 150 m from the bay, so that neither marker covers the other.
      vehicles: [{ ...scooterResponse.vehicles[1], provider: 'dott', vehicle_id: 'dott-1', lat: 45.7511, lng: 4.8512 }],
      parking: [{ id: 'dott:bay', provider: 'dott', name: 'Place test', lat: BAY[0], lng: BAY[1], mandatory: true }],
      meta: { ...scooterResponse.meta, mode: 'vehicles', totalVehicles: 1, zoom },
    }) });
  });
  await locateAt(page, there);
  const walks = await answerWalks(page, { body: { path: way, distanceM: Math.round(walkM) } }, { held: true });
  await page.goto('/map?origin=45.75,4.85');
  const map = page.locator('.leaflet-container');
  await expect(map).toHaveAttribute('data-zoom', '16');
  await page.getByRole('button', { name: 'Dott parking: Place test', exact: true }).click();
  const card = page.locator('.dock-card');
  await expect(card.getByRole('heading', { name: 'Dott parking bay' })).toBeVisible();
  if (await desktopLayout(page)) await expect(page.getByRole('dialog', { name: 'Dott parking bay' })).toBeVisible();
  // No location yet, so no walking time.
  await expect(card.locator('.card-title p')).toHaveText('Place test');

  // The one button of the card, in the app's blue.
  const directions = card.getByRole('button', { name: 'Directions', exact: true });
  await expect(directions).toHaveClass(/card-action-primary/);
  expect(await directions.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(0, 112, 235)');
  await directions.click();
  // Your location is found first, then the way, and the button turns all along.
  await expect(directions).toHaveAttribute('aria-busy', 'true');
  await expect(directions.locator('.walk-action-spinner')).toBeVisible();
  await expect.poll(() => walks.asked.length).toBe(1);
  expect(walks.asked[0]).toEqual({ method: 'POST', body: { from: there, to: BAY } });
  // Located from the card: the map stayed on the bay.
  await expect(map).toHaveAttribute('data-zoom', '16');

  walks.release();
  const hide = card.getByRole('button', { name: 'Hide route', exact: true });
  await expect(hide).toBeVisible();
  await expect(hide).toHaveClass(/card-action-primary/);
  await expect(page.locator('path.walk-route-casing')).toBeVisible();
  await expect(page.locator('path.walk-route-dots')).toBeVisible();
  await expect(card.getByRole('status')).toHaveText(`Route shown: ≈${minutesFor(walkM)} min walk · ${Math.round(walkM)} m`);
  await expect(card.locator('.bay-walk')).toHaveText(`≈${minutesFor(walkM)} min walk`);
  await expect.poll(async () => routeInFrame(page)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).include(await cardSurface(page)).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);

  await hide.click();
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  await expect(directions).toBeVisible();
});

test('a scooter that leaves the map while you walk to it is said to be gone, and its way goes with it; back, it has Directions again', async ({ page }) => {
  let taken = false;
  let answersWithout = 0;
  let answersWith = 0;
  await page.route('**/api/scooters?**', async route => {
    const zoom = Number(new URL(route.request().url()).searchParams.get('zoom'));
    if (zoom <= 15) return route.fallback();
    if (!taken) {
      answersWith += 1;
      return route.fallback();
    }
    answersWithout += 1;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      ...scooterResponse,
      vehicles: scooterResponse.vehicles.filter(vehicle => vehicle.provider !== 'lime'),
      providers: { bird: 1, bolt: 1 },
      // Each answer is a new update of the data.
      meta: { ...scooterResponse.meta, mode: 'vehicles', totalVehicles: 2, zoom, generatedAt: new Date().toISOString() },
    }) });
  });
  await locateAt(page, HERE);
  await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
  await page.goto('/map');
  await page.getByRole('button', { name: 'Near me', exact: true }).click();
  const card = await openLime(page);
  await card.getByRole('button', { name: 'Directions', exact: true }).click();
  await expect(card.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
  await expect(page.locator('path.walk-route-dots')).toBeVisible();

  // Missing from two updates in a row, of the part of the map where it was. Data is
  // asked for again once the view leaves what was asked for, or turns to groups and back:
  // out to the street, out to the groups of the city, and in again. The scooter stays in view.
  taken = true;
  await zoomTo(page, 16);
  await expect.poll(() => answersWithout).toBeGreaterThanOrEqual(1);
  await expect(card.getByRole('status')).toHaveText(/^Route shown: /);
  await zoomTo(page, 15);
  await zoomTo(page, 16);
  await expect.poll(() => answersWithout).toBeGreaterThanOrEqual(2);

  await expect(card.getByRole('status')).toHaveText('No longer on the map. Someone may have taken it.');
  await expect(card.locator('.walk-status-gone')).toBeVisible();
  // Nothing is left to do with it: neither Directions nor its app.
  await expect(card.locator('.card-actions')).toHaveCount(0);
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  // Where it was stays on the map, faded, and still selected.
  await expect(page.locator('.scooter-marker-gone')).toHaveCount(1);
  await expect(page.locator('.scooter-marker-gone')).toHaveClass(/scooter-marker-selected/);

  // In the data again after all: the walk is over, and the card has Directions again.
  taken = false;
  const before = answersWith;
  await zoomTo(page, 15);
  await zoomTo(page, 16);
  await expect.poll(() => answersWith).toBeGreaterThan(before);
  await expect(card.getByRole('button', { name: 'Directions', exact: true })).toBeVisible();
  await expect(card.getByRole('status')).toHaveText('');
  await expect(page.locator('.scooter-marker-gone')).toHaveCount(0);
  await expect(page.locator('path.walk-route')).toHaveCount(0);
  await card.getByRole('button', { name: 'Close scooter details' }).click();
  await expect(card).toHaveCount(0);
});

test.describe('on a desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'The card is beside its marker only in a wide window with a mouse.');

  // While a walk lasts its scooter stays selected when the map is dragged away
  // from it: its card, with nothing to point at, keeps clear of the controls.
  test('the card of a scooter walked to stays clear of the controls in the corner once the scooter is out of view', async ({ page }) => {
    await locateAt(page, HERE);
    await answerWalks(page, { body: { path: WAY, distanceM: Math.round(WALK_M) } });
    await page.goto('/map');
    await page.getByRole('button', { name: 'Near me', exact: true }).click();
    await expect(page.locator('.user-location-marker')).toBeVisible();
    const card = await openLime(page);
    await card.getByRole('button', { name: 'Directions', exact: true }).click();
    await expect(page.locator('path.walk-route-dots')).toBeVisible();

    // Dragged down until the scooter is below the window.
    await moveOutOfView(page);
    // Longer than the card takes to follow its marker.
    await page.waitForTimeout(600);
    const dialog = page.getByRole('dialog', { name: 'Lime scooter' });
    await expect(dialog.getByRole('button', { name: 'Hide route', exact: true })).toBeVisible();
    const box = (await dialog.boundingBox())!;
    expect.soft(overlap(box, (await page.getByRole('button', { name: 'Near me', exact: true }).boundingBox())!)).toBe(false);
    expect.soft(overlap(box, (await page.locator('.map-attribution').boundingBox())!)).toBe(false);
    await expect(dialog).toHaveAttribute('data-detached', 'true');
    await expect(dialog.locator('.marker-popover-arrow')).toBeHidden();
  });
});
