// Draws every icon from the one drawing of it, public/icon.svg: the PNGs of
// the site beside it, the site's favicon and the icon of the iOS app.
//
//   npm run generate:icons
//
// The drawing is the rider's dot on the map, the beam of where they face, and
// in it the nearest scooter as the map shows it at night. What matters of it
// stays inside the circle a maskable icon may be cut to.
//
// sharp comes with Next.js; it is not a dependency of its own.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'public/icon.svg');

// Drawn at twice 1024 px and reduced, so the smallest are averaged, not sampled.
const drawn = size => sharp(source, { density: 144 }).resize(size, size);
// The drawing covers its square. iOS refuses an icon with transparency.
const opaque = size => drawn(size).removeAlpha().png({ compressionLevel: 9 }).toBuffer();

const PNGS = {
  'public/icon-32.png': 32,
  'public/icon-180.png': 180,
  'public/icon-192.png': 192,
  'public/icon-512.png': 512,
  'public/icon-master.png': 1254,
  'ios/ScootRadar/Assets.xcassets/AppIcon.appiconset/AppIcon.png': 1024,
};
const FAVICON = { file: 'src/app/favicon.ico', sizes: [16, 32, 48] };

// An .ico is a directory followed by its pictures, each of which may be a PNG as it is.
function ico(pictures) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // an icon, not a cursor
  header.writeUInt16LE(pictures.length, 4);
  let offset = header.length + 16 * pictures.length;
  const entries = pictures.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pictures.map(({ data }) => data)]);
}

for (const [file, size] of Object.entries(PNGS)) {
  writeFileSync(path.join(root, file), await opaque(size));
  console.log(file);
}

// Inside an .ico a PNG is to be 32 bits a pixel: these keep their alpha channel.
const pictures = await Promise.all(
  FAVICON.sizes.map(async size => ({ size, data: await drawn(size).ensureAlpha().png({ compressionLevel: 9 }).toBuffer() }))
);
writeFileSync(path.join(root, FAVICON.file), ico(pictures));
console.log(FAVICON.file);
