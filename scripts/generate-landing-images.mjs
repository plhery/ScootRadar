// Writes the pictures of the landing page (public/landing) from the captures
// the App Store screenshots are made of.
//
//   node scripts/generate-landing-images.mjs
//
// Each capture is 1320 × 2868. The page shows them in a phone at most 340 px
// wide, so 780 px across is enough for two device pixels per unit. The numbers
// on a capture are the live ones of the moment it was taken and differ between
// the languages: the headline repeats the one on the dark map, which
// src/lib/landingSnapshot.ts holds, so keep the two in step.
//
// sharp comes with Next.js; it is not a dependency of its own.

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const captures = path.join(root, 'ios/AppStore/screenshots/src/captures');
const out = path.join(root, 'public/landing');

const LOCALES = ['en', 'de', 'fr', 'it'];
const SCENES = ['nearby', 'overview', 'dark'];
const PHONE_WIDTH = 780;

mkdirSync(out, { recursive: true });

for (const locale of LOCALES) {
  for (const scene of SCENES) {
    await sharp(path.join(captures, `${locale}-${scene}.jpg`))
      .resize({ width: PHONE_WIDTH })
      .webp({ quality: 80 })
      .toFile(path.join(out, `${locale}-${scene}.webp`));
  }
}
