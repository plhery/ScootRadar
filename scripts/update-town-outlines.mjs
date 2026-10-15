import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundary, outerRings, writeCatalog } from './boundaries.mjs';

// Fills the areas of data/town-outlines.json with each town's boundary,
// simplified to within TOLERANCE_M: OpenStreetMap's municipalities (ODbL).
// Every piece is kept but those too small to keep a shape, islets that
// simplify to a line. Run it after adding a town, then
// npm run generate:providers, which checks the file.

const TOLERANCE_M = 20;
const path = resolve(process.cwd(), 'data/town-outlines.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));

for (const town of catalog.towns) {
  // Outer rings only. A town inside another's outline, as Roubaix in Lille
  // Métropole's, has an outline of its own, and the smaller one holding a scooter wins.
  town.areas = outerRings(await boundary(town.boundary), { minAreaKm2: 0, tolerance: TOLERANCE_M, digits: 5 })
    .filter(area => area.length >= 3);
  console.log(`${town.city}: ${town.areas.map(area => area.length).join(' + ')} points`);
}

writeCatalog(path, catalog);
