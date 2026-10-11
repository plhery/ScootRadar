// Takes the pictures of the landing page (public/landing) from the iPhone app
// in a simulator: in each language, by night and by day in front of Zürich
// main station, and by night before the phone is located, over the cities
// around Switzerland.
//
//   npm run generate:landing-images
//
// It needs Xcode and a simulator of an iPhone Pro, whose screen has the
// proportions of the phone on the page. It looks for one named "Scooters
// landing": create it once, or name another, by its name or its identifier.
//
//   xcrun simctl create "Scooters landing" "iPhone 18 Pro"
//   SCOOTRADAR_SIMULATOR="iPhone 18 Pro" npm run generate:landing-images
//
// The run builds the app and installs it afresh, so what that simulator held
// of the app is lost. The app shows the live data, which the server renews
// about every minute: the pictures by the station are taken right after a
// renewal, and again if the next one came before the last language opened, so
// the four languages show the same scooters. The run ends by printing the
// nearest scooter of each provider at that moment. Copy them into
// src/lib/landingSnapshot.ts, with the number on the "All" chip of the dark
// pictures, or the page contradicts its own phone; that the four pictures do
// carry the same number is for you to see.
//
// sharp comes with Next.js; it is not a dependency of its own.

import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/landing');
const SIMULATOR = process.env.SCOOTRADAR_SIMULATOR ?? 'Scooters landing';
const BUNDLE = 'com.plhery.scootradar';
const API = 'https://scootradar.com/api/scooters';

// A public place, not a rider's position: the square in front of Zürich main station.
const RIDER = { latitude: 47.3763, longitude: 8.5395 };
const LOCALES = ['en', 'de', 'fr', 'it'];
// The page shows a capture in a phone at most 340 px wide: 780 px across is
// two device pixels per unit, and 1695 down the proportions of an iPhone Pro.
const PICTURE = { width: 780, height: 1695 };
// The map, its scooters and their names are drawn three seconds after the app
// opens, and a change of appearance within one. Longer waits would not fit
// four languages between two renewals of the data.
const OPENED_MS = 5_000;
const APPEARANCE_MS = 2_000;

const run = promisify(execFile);
const simctl = (...args) => run('xcrun', ['simctl', ...args], { maxBuffer: 64 * 1024 * 1024 });

const { devices } = JSON.parse((await simctl('list', 'devices', 'available', '-j')).stdout);
const device = Object.values(devices).flat().find(({ name, udid }) => name === SIMULATOR || udid === SIMULATOR);
if (!device) {
  console.error(`No simulator is named "${SIMULATOR}". Create it with: xcrun simctl create "${SIMULATOR}" "iPhone 18 Pro"`);
  process.exit(1);
}
const { udid } = device;
const bootedHere = device.state !== 'Booted';
const work = mkdtempSync(path.join(os.tmpdir(), 'scootradar-landing-'));
mkdirSync(out, { recursive: true });

/** The scooters around the station as the server has them now, past any cache: no two calls ask the same box. */
let asked = 0;
async function scootersNow() {
  asked += 1;
  const box = {
    south: RIDER.latitude - 0.004,
    west: RIDER.longitude - 0.006,
    north: RIDER.latitude + 0.004,
    east: RIDER.longitude + 0.006 + asked * 0.00001,
  };
  const query = new URLSearchParams({ ...Object.fromEntries(Object.entries(box).map(([side, degrees]) => [side, degrees.toFixed(5)])), zoom: '17' });
  const response = await fetch(`${API}?${query}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${API} answered ${response.status}`);
  return response.json();
}

/** Waits for the server to renew its data and returns the new answer. */
async function renewal() {
  const { generatedAt } = (await scootersNow()).meta;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    await sleep(3_000);
    const answer = await scootersNow();
    if (answer.meta.generatedAt !== generatedAt) return answer;
  }
  throw new Error('The server has not renewed its data in twelve minutes.');
}

async function open(locale) {
  await simctl('terminate', udid, BUNDLE).catch(() => {});
  await simctl('launch', udid, BUNDLE, '-AppleLanguages', `(${locale})`, '-AppleLocale', `${locale}_CH`);
}

async function picture(name) {
  const capture = path.join(work, `${name}.png`);
  await simctl('io', udid, 'screenshot', capture);
  await sharp(capture)
    .resize({ ...PICTURE, fit: 'cover', position: 'top' })
    .webp({ quality: 82 })
    .toFile(path.join(out, `${name}.webp`));
}

let street;
try {
  if (bootedHere) await simctl('boot', udid);
  await simctl('bootstatus', udid);

  console.log('Building the app…');
  const derived = path.join(os.tmpdir(), 'scootradar-landing-build');
  await run(
    'xcodebuild',
    [
      'build', '-quiet',
      '-project', path.join(root, 'ios/ScootRadar.xcodeproj'),
      '-scheme', 'ScootRadar',
      '-destination', `platform=iOS Simulator,id=${udid}`,
      '-derivedDataPath', derived,
      'CODE_SIGNING_ALLOWED=NO',
    ],
    { maxBuffer: 256 * 1024 * 1024 }
  );
  await simctl('uninstall', udid, BUNDLE).catch(() => {});
  await simctl('install', udid, path.join(derived, 'Build/Products/Debug-iphonesimulator/ScootRadar.app'));
  await simctl(
    'status_bar', udid, 'override',
    '--time', '09:41',
    '--dataNetwork', 'wifi', '--wifiMode', 'active', '--wifiBars', '3',
    '--cellularMode', 'active', '--cellularBars', '4',
    '--batteryState', 'discharging', '--batteryLevel', '100'
  );

  // An app that has not asked for the position yet opens on the cities.
  await simctl('privacy', udid, 'reset', 'location', BUNDLE);
  await simctl('ui', udid, 'appearance', 'dark');
  for (const locale of LOCALES) {
    await open(locale);
    // The first of these draws a map the phone has never loaded.
    await sleep(locale === LOCALES[0] ? 3 * OPENED_MS : OPENED_MS);
    await picture(`${locale}-overview`);
  }

  // Allowed to, the app locates by itself as it opens. A first look a few
  // metres away puts the streets on the phone before the pictures that are timed.
  await simctl('privacy', udid, 'grant', 'location', BUNDLE);
  await simctl('location', udid, 'set', `${RIDER.latitude + 0.0004},${RIDER.longitude}`);
  await open(LOCALES[0]);
  await sleep(3 * OPENED_MS);
  await simctl('location', udid, 'set', `${RIDER.latitude},${RIDER.longitude}`);

  for (;;) {
    console.log('Waiting for the server to renew its data…');
    street = await renewal();
    for (const locale of LOCALES) {
      await simctl('ui', udid, 'appearance', 'dark');
      await open(locale);
      await sleep(OPENED_MS);
      await picture(`${locale}-dark`);
      await simctl('ui', udid, 'appearance', 'light');
      await sleep(APPEARANCE_MS);
      await picture(`${locale}-nearby`);
    }
    // The last language asked for its scooters as it opened, a few seconds ago.
    if ((await scootersNow()).meta.generatedAt === street.meta.generatedAt) break;
    console.log('The data was renewed between two languages: taking the pictures by the station again.');
  }
} finally {
  await simctl('terminate', udid, BUNDLE).catch(() => {});
  await simctl('status_bar', udid, 'clear').catch(() => {});
  if (bootedHere) await simctl('shutdown', udid).catch(() => {});
  rmSync(work, { recursive: true, force: true });
}

// The distance as the app measures it, near enough: to the metre at this range.
function metres(lat, lng) {
  const radians = degrees => (degrees * Math.PI) / 180;
  const a =
    Math.sin(radians(lat - RIDER.latitude) / 2) ** 2 +
    Math.cos(radians(RIDER.latitude)) * Math.cos(radians(lat)) * Math.sin(radians(lng - RIDER.longitude) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

const nearest = new Map();
for (const { provider, lat, lng, battery, range_m: rangeM, pricing = null } of street.vehicles) {
  const distanceM = metres(lat, lng);
  if (distanceM < (nearest.get(provider)?.distanceM ?? Infinity)) {
    nearest.set(provider, { provider, distanceM: Math.round(distanceM), battery, rangeM, pricing });
  }
}

console.log(`The pictures by the station show the data of ${street.meta.generatedAt}.`);
console.log('The nearest scooter of each provider, the first of which the dock of those pictures names:');
for (const vehicle of [...nearest.values()].sort((a, b) => a.distanceM - b.distanceM)) console.log(`  ${JSON.stringify(vehicle)}`);
console.log('Read the scooters in view on the "All" chip of the four dark pictures: it has to be one number.');
