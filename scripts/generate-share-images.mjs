// Draws the picture a shared link to the site shows (public/share), one per
// language of the landing page, 1200 × 630 as Open Graph and X ask for.
//
//   npm run generate:share-images
//
// Each is the landing page in short: its name, the promise of its title in
// that language (meta.share.title in src/lib/landingCopy.ts), the providers'
// tiles, and the capture of the dark map that the page opens with
// (scripts/generate-landing-images.mjs takes it: draw these after it). The
// fonts come from Google Fonts, as next/font fetches them at build time, so
// this needs the network.

import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { transform } from 'esbuild';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public/share');
const WIDTH = 1200;
const HEIGHT = 630;

// The words of the page, its snapshot and the name of the site import nothing but types: they compile on their own.
async function load(file) {
  const { code } = await transform(readFileSync(path.join(root, file), 'utf8'), { loader: 'ts', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
const { LANDING_COPY, LANDING_LOCALES } = await load('src/lib/landingCopy.ts');
const { LANDING_NEAREST } = await load('src/lib/landingSnapshot.ts');
const { SITE_NAME } = await load('src/lib/site.ts');
const providers = JSON.parse(readFileSync(path.join(root, 'data/providers.json'), 'utf8'));

// As on the page: Bird's and Swing's black would vanish on the night, so their tiles
// are the light ones, and the only ones too light for the white initials of the others.
const TILE_COLORS = { bird: '#f4f5f7', swing: '#f4f5f7' };
const DARK_LETTERS = new Set(['bird', 'swing']);
const tileColor = key => TILE_COLORS[key] ?? providers.find(provider => provider.key === key).color;
// The tiles share the 600 px of the copy in one row, at most 50 px each.
const TILE_GAP = 8;
const TILE = Math.min(50, Math.floor((600 + TILE_GAP) / providers.length) - TILE_GAP);

const escape = text => text.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Inline: a page set from a string may not load files from the disk.
const TYPES = { '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const asset = file =>
  `data:${TYPES[path.extname(file)]};base64,${readFileSync(path.join(root, 'public', file)).toString('base64')}`;

function page(locale) {
  const copy = LANDING_COPY[locale];
  const tiles = providers
    .map(({ key, initial }) => {
      const classes = ['tile', initial.length > 1 && 'tile--wide', DARK_LETTERS.has(key) && 'tile--dark'];
      return `<span class="${classes.filter(Boolean).join(' ')}" style="--c:${tileColor(key)}">${escape(initial)}</span>`;
    })
    .join('');
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@700;800&family=Red+Hat+Text:wght@500&display=block">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    overflow: hidden;
    background: #090b10;
    color: #f4f5f7;
    font-family: 'Red Hat Text', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .orb { position: absolute; border-radius: 50%; filter: blur(10px); }
  .orb--night { left: 640px; top: -120px; width: 620px; height: 620px; background: radial-gradient(closest-side, rgba(47, 123, 255, 0.34), transparent); }
  .orb--near { left: 520px; top: 300px; width: 520px; height: 420px; background: radial-gradient(closest-side, color-mix(in srgb, ${tileColor(LANDING_NEAREST[0].provider)} 26%, transparent), transparent); }
  .copy { position: absolute; left: 72px; top: 64px; bottom: 64px; width: 600px; display: flex; flex-direction: column; }
  .brand { display: flex; align-items: center; gap: 14px; font: 800 30px 'Red Hat Display', sans-serif; }
  .brand img { width: 44px; height: 44px; border-radius: 12px; }
  h1 {
    margin: auto 0 0;
    font: 800 70px/1 'Red Hat Display', sans-serif;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .tiles { display: flex; gap: ${TILE_GAP}px; margin-top: 36px; }
  .tile {
    display: grid; place-items: center; width: ${TILE}px; height: ${TILE}px; border-radius: ${Math.round(TILE * 0.32)}px;
    background: var(--c); color: #ffffff; font: 800 ${Math.round(TILE * 0.4)}px 'Red Hat Display', sans-serif;
  }
  .tile--wide { font-size: ${Math.round(TILE * 0.34)}px; }
  .tile--dark { color: #10131a; }
  .note { margin: 22px 0 0; font-size: 24px; color: #a3a8b3; }
  .phone { position: absolute; left: 790px; top: 58px; width: 340px; }
  .phone-body { position: relative; padding: 11px; border-radius: 58px; background: #1b1f29; box-shadow: inset 0 0 0 1.5px rgba(255, 255, 255, 0.16), 0 0 140px 30px rgba(47, 123, 255, 0.28); }
  .phone-body::before { content: ''; position: absolute; left: 50%; top: 22px; width: 98px; height: 29px; margin-left: -49px; border-radius: 15px; background: #000000; }
  .phone-body img { display: block; width: 100%; border-radius: 47px; }
</style>
</head>
<body>
  <div class="orb orb--night"></div>
  <div class="orb orb--near"></div>
  <div class="copy">
    <div class="brand"><img src="${asset('icon.svg')}" alt="">${escape(SITE_NAME)}</div>
    <h1>${escape(copy.meta.share.title)}</h1>
    <div class="tiles">${tiles}</div>
    <p class="note">${escape(copy.hero.note)}</p>
  </div>
  <div class="phone"><div class="phone-body"><img src="${asset(`landing/${locale}-dark.webp`)}" alt=""></div></div>
</body>
</html>`;
}

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
  for (const locale of LANDING_LOCALES) {
    await tab.setContent(page(locale), { waitUntil: 'networkidle' });
    await tab.evaluate(() => document.fonts.ready);
    const loaded = await tab.evaluate(() => document.fonts.check('800 70px "Red Hat Display"') && document.fonts.check('500 24px "Red Hat Text"'));
    if (!loaded) throw new Error('The fonts did not load: is the network there?');
    const picture = await tab.screenshot({ type: 'png' });
    const file = path.join(out, `${locale}.png`);
    await sharp(picture).png({ palette: true, quality: 90, effort: 10 }).toFile(file);
    console.log(path.relative(root, file));
  }
} finally {
  await browser.close();
}
